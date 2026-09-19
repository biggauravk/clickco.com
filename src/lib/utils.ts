import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return Number(value ?? 0);
}

export function asBoolean(value: unknown): boolean {
  return value === true || value === "t" || value === "true";
}

export function asIso(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function parseImages(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean).slice(0, 5);
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean).slice(0, 5);
  } catch {
    /* ignore */
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);
}
