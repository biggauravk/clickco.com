import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAdminDialog } from "@/components/admin/admin-dialog";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminPage, AdminState } from "@/components/admin/admin-utils";
import { MediaPicker } from "@/components/admin/media-picker";
import { Button } from "@/components/ui/button";
import { deleteMediaAsset, listMediaAssets, type MediaAsset } from "@/lib/media";

export const Route = createFileRoute("/admin/media")({ component: AdminMediaPage });

function AdminMediaPage() {
  const { alert, confirm } = useAdminDialog();
  const [assets, setAssets] = useState<MediaAsset[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<unknown>(null); const [selected, setSelected] = useState<string[]>([]);
  async function load() { setLoading(true); try { setAssets(await listMediaAssets({ data: {} })); setError(null); } catch (e) { setError(e); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  async function remove(asset: MediaAsset) { if (!await confirm({ title: "Delete media?", description: `You are about to permanently delete ${asset.fileName}. This action cannot be undone.`, confirmLabel: "Delete media", cancelLabel: "Keep media", destructive: true })) return; try { await deleteMediaAsset({ data: { id: asset.id, storagePath: asset.storagePath } }); await alert({ title: "Media deleted", description: "The media was deleted successfully." }); await load(); } catch (e) { await alert({ title: "Media deletion failed", description: e instanceof Error ? e.message : "Something went wrong. Please try again." }); } }
  return <AdminLayout><AdminPage title="Media"><p className="max-w-2xl text-sm text-muted-foreground">Manage product images, brand artwork, mosaic tiles, films, and posters.</p><div className="rounded-2xl border border-border bg-card p-5"><MediaPicker value={selected} onChange={(next) => { setSelected(next); void load(); }} purpose="mosaic" mediaType="image" max={1} ratio={4 / 5} label="Add mosaic media" /></div><AdminState loading={loading} error={error}><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{assets.map((asset) => { const imageRatio = asset.purpose === "product" ? "3 / 4" : asset.purpose === "brand" ? "1 / 1" : asset.purpose === "mosaic" ? "4 / 5" : asset.purpose === "poster" ? "9 / 16" : undefined; return <article key={asset.id} className="overflow-hidden rounded-2xl border border-border bg-card"><div className="bg-muted" style={imageRatio ? { aspectRatio: imageRatio } : { aspectRatio: asset.aspectRatio && asset.aspectRatio < 1 ? "9 / 16" : "16 / 9" }}>{asset.mediaType === "video" ? <video src={asset.publicUrl} controls className="size-full object-contain" /> : <img src={asset.publicUrl} alt={asset.fileName} className="size-full object-contain object-center" />}</div><div className="p-4"><p className="truncate text-sm font-medium">{asset.fileName}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{asset.purpose} · {asset.mediaType}</p><Button type="button" variant="ghost" size="sm" className="mt-3" onClick={() => void remove(asset)}>Delete</Button></div></article>; })}{assets.length === 0 ? <p className="col-span-full p-6 text-sm text-muted-foreground">No media uploaded yet.</p> : null}</div></AdminState></AdminPage></AdminLayout>;
}
