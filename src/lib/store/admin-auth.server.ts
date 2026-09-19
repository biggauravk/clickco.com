import { SignJWT, jwtVerify } from "jose";
import { getCookie, getRequest, setCookie } from "@tanstack/react-start/server";
import { env } from "@/lib/env.server";

const COOKIE = "meridian_admin";
const TTL_SEC = 60 * 60 * 24 * 7;
export type AdminIdentity = { email: string };
function secretKey() {
  const raw = env("JWT_SECRET");
  if (!raw) throw new Error("JWT_SECRET is required for admin authentication.");
  return new TextEncoder().encode(raw);
}
export function ownerEmail(): string {
  const email = env("OWNER_EMAIL");
  if (!email) throw new Error("OWNER_EMAIL is required for admin authentication.");
  return email.toLowerCase();
}
export function ownerPassword(): string {
  const password = env("OWNER_PASSWORD");
  if (!password) throw new Error("OWNER_PASSWORD is required for admin authentication.");
  return password;
}
function cookieSecure(): boolean {
  try { return new URL(getRequest()?.url ?? "http://localhost").protocol === "https:"; } catch { return false; }
}
export async function signAdminToken(email: string): Promise<string> {
  return new SignJWT({ role: "owner", email }).setProtectedHeader({ alg: "HS256" }).setSubject("owner").setIssuedAt().setExpirationTime(`${TTL_SEC}s`).sign(secretKey());
}
export async function verifyAdminToken(token: string): Promise<AdminIdentity | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const email = typeof payload.email === "string" ? payload.email : "";
    return email && payload.role === "owner" ? { email } : null;
  } catch { return null; }
}
export async function readAdminSession(clientToken?: string): Promise<AdminIdentity | null> {
  const header = getRequest()?.headers.get("authorization") ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
  const token = clientToken || getCookie(COOKIE) || bearer;
  return token ? verifyAdminToken(token) : null;
}
export async function requireAdmin(clientToken?: string): Promise<AdminIdentity> {
  const admin = await readAdminSession(clientToken);
  if (!admin) { const error = new Error("Unauthorized") as Error & { status?: number }; error.status = 401; throw error; }
  return admin;
}
export async function writeAdminCookie(token: string): Promise<void> { setCookie(COOKIE, token, { httpOnly: true, sameSite: "lax", path: "/", maxAge: TTL_SEC, secure: cookieSecure() }); }
export async function clearAdminCookie(): Promise<void> { setCookie(COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0, secure: cookieSecure() }); }
export function credentialsMatch(email: string, password: string): boolean { return email.trim().toLowerCase() === ownerEmail() && password === ownerPassword(); }
