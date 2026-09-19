import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { env } from "@/lib/env.server";
import { adminMiddleware } from "@/lib/store/admin-middleware";

export type MediaType = "image" | "video";
export type MediaPurpose = "product" | "brand" | "mosaic" | "video" | "poster" | "general";
export type MediaAsset = { id: number; storagePath: string; publicUrl: string; fileName: string; mediaType: MediaType; purpose: MediaPurpose; mimeType: string; fileSize: number; width: number | null; height: number | null; aspectRatio: number | null; createdAt?: string };
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/x-m4v"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
export const REQUIRED_IMAGE_RATIOS = {
  product: 3 / 4,
  brand: 1,
  mosaic: 4 / 5,
  poster: 9 / 16,
} as const;
function storageConfig() {
  const configuredUrl = env("SUPABASE_URL"); const key = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!configuredUrl || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for media uploads.");
  const url = configuredUrl.replace(/\/+$/, "").replace(/\/storage\/v1$/, "");
  return { url, key, bucket: env("SUPABASE_MEDIA_BUCKET") ?? "meridian-media" };
}
async function storageRequest(path: string, init: RequestInit = {}) {
  const config = storageConfig();
  try {
    return await fetch(`${config.url}/storage/v1${path}`, { ...init, headers: { Authorization: `Bearer ${config.key}`, apikey: config.key, ...(init.headers ?? {}) } });
  } catch {
    throw new Error("Could not connect to Supabase Storage. Check that SUPABASE_URL is the project URL and that the Vercel server can reach Supabase.");
  }
}
async function ensureBucket() {
  const config = storageConfig();
  const existing = await storageRequest(`/bucket/${encodeURIComponent(config.bucket)}`);
  if (existing.ok) return;
  const response = await storageRequest("/bucket", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: config.bucket, name: config.bucket, public: true }) });
  if (response.ok || response.status === 409) return;
  const retry = await storageRequest(`/bucket/${encodeURIComponent(config.bucket)}`);
  if (retry.ok) return;
  const detail = await response.text().catch(() => "");
  throw new Error(`Could not access Supabase Storage bucket “${config.bucket}” (${response.status})${detail ? `: ${detail.slice(0, 240)}` : "."}`);
}
async function storageError(response: Response, action: string) { const detail = await response.text().catch(() => ""); return new Error(`${action} (${response.status})${detail ? `: ${detail.slice(0, 240)}` : "."}`); }
function safeFileName(name: string) { return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "media"; }
function mediaTypeFor(file: File): MediaType | null { if (IMAGE_TYPES.has(file.type)) return "image"; if (VIDEO_TYPES.has(file.type)) return "video"; return null; }
function validVideoRatio(width: number, height: number) { const ratio = width / height; return Math.abs(ratio - 16 / 9) <= 0.02 || Math.abs(ratio - 9 / 16) <= 0.02; }
function expectedImageRatio(purpose: MediaPurpose) { return REQUIRED_IMAGE_RATIOS[purpose as keyof typeof REQUIRED_IMAGE_RATIOS] ?? null; }
function validateMediaMetadata(mediaType: MediaType, purpose: MediaPurpose, mimeType: string, fileSize: number, width: number, height: number, ratio: number) {
  if (mediaType === "image" && !IMAGE_TYPES.has(mimeType)) throw new Error("Unsupported image type.");
  if (mediaType === "video" && !VIDEO_TYPES.has(mimeType)) throw new Error("Unsupported video type. Use MP4, MOV, or M4V.");
  if (!Number.isInteger(fileSize) || fileSize <= 0 || fileSize > (mediaType === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) throw new Error(mediaType === "video" ? "Videos must be 250 MB or smaller." : "Images must be 10 MB or smaller.");
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw new Error("Media dimensions could not be verified.");
  const actual = width / height;
  if (mediaType === "video" && !validVideoRatio(width, height)) throw new Error("Videos must use either 16:9 or 9:16 dimensions.");
}
function publicUrl(path: string) { const config = storageConfig(); return `${config.url}/storage/v1/object/public/${config.bucket}/${path}`; }
const purposeSchema = z.enum(["product", "brand", "mosaic", "video", "poster", "general"]);
export const listMediaAssets = createServerFn({ method: "GET" }).middleware([adminMiddleware]).validator(z.object({ purpose: purposeSchema.optional(), mediaType: z.enum(["image", "video"]).optional() })).handler(async ({ data }) => {
  const sql = await getSql();
  const rows = await sql<{ id: number; storage_path: string; public_url: string; file_name: string; media_type: MediaType; purpose: MediaPurpose; mime_type: string; file_size: number; width: number | null; height: number | null; aspect_ratio: number | null; created_at: unknown }>`
    select id, storage_path, public_url, file_name, media_type, purpose, mime_type, file_size, width, height, aspect_ratio, created_at from media_assets where (${data.purpose ?? null}::text is null or purpose = ${data.purpose ?? null}) and (${data.mediaType ?? null}::text is null or media_type = ${data.mediaType ?? null}) order by created_at desc
  `;
  return rows.map((row) => ({ id: row.id, storagePath: row.storage_path, publicUrl: row.public_url, fileName: row.file_name, mediaType: row.media_type, purpose: row.purpose, mimeType: row.mime_type, fileSize: row.file_size, width: row.width, height: row.height, aspectRatio: row.aspect_ratio, createdAt: String(row.created_at) }));
});
export const createSignedMediaUpload = createServerFn({ method: "POST" }).middleware([adminMiddleware]).validator(z.object({ fileName: z.string().min(1).max(240), mediaType: z.enum(["image", "video"]), mimeType: z.string().min(1).max(100), fileSize: z.number().int().positive(), width: z.number().int().positive(), height: z.number().int().positive(), ratio: z.number().positive(), purpose: purposeSchema })).handler(async ({ data }) => {
  validateMediaMetadata(data.mediaType, data.purpose, data.mimeType, data.fileSize, data.width, data.height, data.ratio);
  const config = storageConfig(); await ensureBucket();
  const path = `${data.purpose}/${crypto.randomUUID()}-${safeFileName(data.fileName)}`;
  const response = await storageRequest(`/object/upload/sign/${encodeURIComponent(config.bucket)}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
  if (!response.ok) throw await storageError(response, "Could not create a signed Supabase upload URL");
  const signed = await response.json() as { url?: string };
  if (!signed.url) throw new Error("Supabase did not return a signed upload URL.");
  // Supabase returns `url` relative to `/storage/v1` (usually beginning with
  // `/object`). Join it explicitly; URL(relative, base) would treat `/object`
  // as a project-root path and drop the required `/storage/v1` prefix.
  const signedPath = signed.url.replace(/^\/+/, "");
  const signedUrl = /^https?:\/\//i.test(signed.url)
    ? signed.url
    : `${config.url}/${signedPath.startsWith("storage/v1/") ? signedPath : `storage/v1/${signedPath}`}`;
  return { path, signedUrl, publicUrl: publicUrl(path), mediaType: data.mediaType, purpose: data.purpose };
});
export const finalizeSignedMediaUpload = createServerFn({ method: "POST" }).middleware([adminMiddleware]).validator(z.object({ path: z.string().min(1).max(500), publicUrl: z.string().url(), fileName: z.string().min(1).max(240), mediaType: z.enum(["image", "video"]), purpose: purposeSchema, mimeType: z.string().min(1).max(100), fileSize: z.number().int().positive(), width: z.number().int().positive(), height: z.number().int().positive(), ratio: z.number().positive() })).handler(async ({ data }) => {
  if (!data.path.startsWith(`${data.purpose}/`) || data.path.includes("..") || data.path.includes("//")) throw new Error("Invalid media storage path.");
  const canonicalUrl = publicUrl(data.path);
  if (data.publicUrl !== canonicalUrl) throw new Error("Invalid media public URL.");
  validateMediaMetadata(data.mediaType, data.purpose, data.mimeType, data.fileSize, data.width, data.height, data.ratio);
  const check = await fetch(data.publicUrl, { method: "HEAD" });
  if (!check.ok) throw new Error("The media upload did not complete. Please try again.");
  const sql = await getSql(); const actualRatio = data.width / data.height;
  const rows = await sql<{ id: number }>`insert into media_assets (storage_path, public_url, file_name, media_type, purpose, mime_type, file_size, width, height, aspect_ratio) values (${data.path}, ${canonicalUrl}, ${data.fileName}, ${data.mediaType}, ${data.purpose}, ${data.mimeType}, ${data.fileSize}, ${data.width}, ${data.height}, ${actualRatio}) returning id`;
  return { id: rows[0].id, storagePath: data.path, publicUrl: canonicalUrl, fileName: data.fileName, mediaType: data.mediaType, purpose: data.purpose, mimeType: data.mimeType, fileSize: data.fileSize, width: data.width, height: data.height, aspectRatio: actualRatio };
});
export const uploadMediaAsset = createServerFn({ method: "POST" }).middleware([adminMiddleware]).validator((value: FormData) => value).handler(async ({ data }) => {
  const file = data.get("file"); const purpose = String(data.get("purpose") ?? "general") as MediaPurpose; const width = Number(data.get("width") ?? 0) || null; const height = Number(data.get("height") ?? 0) || null;
  if (!(file instanceof File)) throw new Error("Choose a media file first.");
  if (!["product", "brand", "mosaic", "video", "poster", "general"].includes(purpose)) throw new Error("Invalid media purpose.");
  const mediaType = mediaTypeFor(file); if (!mediaType) throw new Error("Unsupported file type. Use JPG, JPEG, PNG, WEBP, HEIC, HEIF, MP4, MOV, or M4V.");
  if (mediaType === "image" && file.size > MAX_IMAGE_BYTES) throw new Error("Images must be 10 MB or smaller.");
  if (mediaType === "video" && file.size > MAX_VIDEO_BYTES) throw new Error("Videos must be 250 MB or smaller.");
  if (mediaType === "image" && expectedImageRatio(purpose) != null && (!width || !height)) throw new Error("Image dimensions are required to verify this media purpose.");
  if (mediaType === "image" && width && height) validateMediaMetadata(mediaType, purpose, file.type, file.size, width, height, width / height);
  const config = storageConfig(); await ensureBucket();
  const path = `${purpose}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const upload = await storageRequest(`/object/${config.bucket}/${path}`, { method: "POST", headers: { "Content-Type": file.type, "x-upsert": "false" }, body: file });
  if (!upload.ok) throw await storageError(upload, "Supabase Storage upload failed");
  const url = publicUrl(path); const sql = await getSql(); const ratio = width && height ? width / height : null;
  const rows = await sql<{ id: number }>`insert into media_assets (storage_path, public_url, file_name, media_type, purpose, mime_type, file_size, width, height, aspect_ratio) values (${path}, ${url}, ${file.name}, ${mediaType}, ${purpose}, ${file.type}, ${file.size}, ${width}, ${height}, ${ratio}) returning id`;
  return { id: rows[0].id, storagePath: path, publicUrl: url, fileName: file.name, mediaType, purpose, mimeType: file.type, fileSize: file.size, width, height, aspectRatio: ratio };
});
export const registerMediaUrl = createServerFn({ method: "POST" }).middleware([adminMiddleware]).validator(z.object({ url: z.string().url(), fileName: z.string().min(1).max(240), purpose: purposeSchema, width: z.number().int().positive().nullable().optional(), height: z.number().int().positive().nullable().optional() })).handler(async ({ data }) => {
  const remote = await fetch(data.url); if (!remote.ok) throw new Error(`Could not fetch image URL (${remote.status}).`);
  const mime = (remote.headers.get("content-type") ?? "").split(";")[0].toLowerCase(); if (!IMAGE_TYPES.has(mime)) throw new Error("The URL must point to a JPG, PNG, WEBP, HEIC, or HEIF image.");
  const body = await remote.arrayBuffer(); if (body.byteLength > MAX_IMAGE_BYTES) throw new Error("Remote images must be 10 MB or smaller.");
  if (expectedImageRatio(data.purpose) != null && (!data.width || !data.height)) throw new Error("Image dimensions are required to verify this media purpose.");
  if (data.width && data.height) validateMediaMetadata("image", data.purpose, mime, body.byteLength, data.width, data.height, data.width / data.height);
  const config = storageConfig(); await ensureBucket(); const path = `url/${crypto.randomUUID()}-${safeFileName(data.fileName)}`;
  const upload = await storageRequest(`/object/${config.bucket}/${path}`, { method: "POST", headers: { "Content-Type": mime, "x-upsert": "false" }, body }); if (!upload.ok) throw await storageError(upload, "Supabase Storage upload failed");
  const url = publicUrl(path); const sql = await getSql(); const width = data.width ?? null; const height = data.height ?? null; const ratio = width && height ? width / height : null;
  const rows = await sql<{ id: number }>`insert into media_assets (storage_path, public_url, file_name, media_type, purpose, mime_type, file_size, width, height, aspect_ratio) values (${path}, ${url}, ${data.fileName}, 'image', ${data.purpose}, ${mime}, ${body.byteLength}, ${width}, ${height}, ${ratio}) returning id`;
  return { id: rows[0].id, storagePath: path, publicUrl: url, fileName: data.fileName, mediaType: "image" as const, purpose: data.purpose, mimeType: mime, fileSize: body.byteLength, width, height, aspectRatio: ratio };
});
export const deleteMediaAsset = createServerFn({ method: "POST" }).middleware([adminMiddleware]).validator(z.object({ id: z.number().int().positive(), storagePath: z.string().min(1) })).handler(async ({ data }) => { const sql = await getSql(); const row = await sql<{ storage_path: string }>`select storage_path from media_assets where id = ${data.id} limit 1`; if (!row[0]) throw new Error("Media asset not found."); if (!row[0].storage_path.startsWith("http")) { const config = storageConfig(); const response = await storageRequest(`/object/${config.bucket}/${row[0].storage_path}`, { method: "DELETE" }); if (!response.ok && response.status !== 404) throw new Error("Could not delete the Storage object."); } await sql`delete from media_assets where id = ${data.id}`; return { ok: true }; });
