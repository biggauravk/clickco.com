export function isValidMediaUrl(value: string): boolean {
  const t = value.trim();
  if (!t || t.length > 600) return false;
  if (t.startsWith("/") && !t.startsWith("//")) return true;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export type ProductInput = {
  name: string;
  brandId: number;
  collection: "men" | "women";
  shortDescription: string;
  fullDescription: string;
  price: number;
  discountPercent: number;
  stock: number;
  images: string[];
  videoUrl: string;
  videoPosterUrl: string;
  featured: boolean;
};

export function validateProductInput(raw: ProductInput): string | null {
  const name = raw.name.trim();
  if (name.length < 2 || name.length > 80) return "Name must be 2–80 characters.";
  if (!Number.isInteger(raw.brandId) || raw.brandId < 1) return "Choose a brand.";
  if (raw.collection !== "men" && raw.collection !== "women") return "Choose Men or Women.";
  if (raw.shortDescription.trim().length < 8 || raw.shortDescription.trim().length > 180) {
    return "Short description must be 8–180 characters.";
  }
  if (raw.fullDescription.trim().length < 20 || raw.fullDescription.trim().length > 2500) {
    return "Full description must be 20–2,500 characters.";
  }
  if (!Number.isFinite(raw.price) || raw.price < 1 || raw.price > 10_000_000) {
    return "Price must be between ₹1 and ₹1,00,00,000.";
  }
  if (!Number.isInteger(raw.discountPercent) || raw.discountPercent < 0 || raw.discountPercent > 80) {
    return "Discount must be 0–80%.";
  }
  if (!Number.isInteger(raw.stock) || raw.stock < 1 || raw.stock > 1000) {
    return "Stock must be 1–1,000 units.";
  }
  const images = raw.images.map((i) => i.trim()).filter(Boolean);
  if (images.length < 1 || images.length > 5) return "Add 1–5 product images.";
  if (images.some((u) => !isValidMediaUrl(u))) return "Each image must be a valid URL or site path.";
  const video = raw.videoUrl.trim();
  if (video && !isValidMediaUrl(video)) return "Video URL is not valid.";
  const poster = raw.videoPosterUrl.trim();
  if (poster && !isValidMediaUrl(poster)) return "Video poster URL is not valid.";
  return null;
}

export type BrandInput = {
  name: string;
  description: string;
  imageUrl: string;
};

export function validateBrandInput(raw: BrandInput): string | null {
  const name = raw.name.trim();
  if (name.length < 2 || name.length > 48) return "Brand title must be 2–48 characters.";
  if (raw.description.trim().length < 12 || raw.description.trim().length > 400) {
    return "Brand description must be 12–400 characters.";
  }
  if (!isValidMediaUrl(raw.imageUrl.trim())) return "Add a valid brand image URL or path.";
  return null;
}
