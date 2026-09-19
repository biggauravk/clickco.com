import { asBoolean, asIso, asNumber, parseImages } from "@/lib/utils";
import { sellingPrice } from "./format";
import type { Brand, Order, OrderItem, Product, Refund, Review } from "./types";
import type { Collection, OrderStatus, RefundStatus } from "./constants";

export type ProductRow = {
  id: number;
  brand_id: number;
  brand_name: string;
  brand_slug: string;
  name: string;
  slug: string;
  collection: string;
  short_description: string;
  full_description: string;
  price: unknown;
  discount_percent: unknown;
  stock: unknown;
  images: unknown;
  video_url: string | null;
  video_poster_url: string | null;
  video_aspect_ratio: unknown;
  featured: unknown;
  created_at: unknown;
};

export function mapProduct(row: ProductRow): Product {
  const price = asNumber(row.price);
  const discount = asNumber(row.discount_percent);
  return {
    id: row.id,
    brandId: row.brand_id,
    brandName: row.brand_name,
    brandSlug: row.brand_slug,
    name: row.name,
    slug: row.slug,
    collection: row.collection === "women" ? "women" : "men",
    shortDescription: row.short_description,
    fullDescription: row.full_description,
    price,
    discountPercent: discount,
    sellingPrice: sellingPrice(price, discount),
    stock: asNumber(row.stock),
    images: parseImages(row.images),
    videoUrl: row.video_url?.trim() || null,
    videoPosterUrl: row.video_poster_url?.trim() || null,
    videoAspectRatio: row.video_aspect_ratio == null ? null : asNumber(row.video_aspect_ratio),
    featured: asBoolean(row.featured),
    createdAt: asIso(row.created_at),
  };
}

export function mapBrand(row: {
  id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  product_count?: unknown;
}): Brand {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.image_url,
    productCount: asNumber(row.product_count ?? 0),
  };
}

export function mapReview(row: {
  id: number;
  product_id: number;
  product_name: string;
  product_slug: string;
  author_name: string;
  rating: unknown;
  body: string;
  created_at: unknown;
  user_id: string;
}): Review {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    productSlug: row.product_slug,
    authorName: row.author_name,
    rating: asNumber(row.rating),
    body: row.body,
    createdAt: asIso(row.created_at),
    userId: row.user_id,
  };
}

export function mapOrderItem(row: {
  id: number;
  product_id: number;
  product_name: string;
  unit_price: unknown;
  quantity: unknown;
  image_url: string;
}): OrderItem {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    unitPrice: asNumber(row.unit_price),
    quantity: asNumber(row.quantity),
    imageUrl: row.image_url,
  };
}

export function mapOrder(
  row: {
    id: number;
    order_number: string;
    user_id: string;
    customer_email: string;
    total: unknown;
    status: string;
    shipping_name: string;
    shipping_phone: string;
    shipping_address: string;
    created_at: unknown;
  },
  items: OrderItem[],
): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    customerEmail: row.customer_email,
    total: asNumber(row.total),
    status: row.status as OrderStatus,
    shippingName: row.shipping_name,
    shippingPhone: row.shipping_phone,
    shippingAddress: row.shipping_address,
    createdAt: asIso(row.created_at),
    items,
  };
}

export function mapRefund(row: {
  id: number;
  order_id: number;
  order_number: string;
  user_id: string;
  amount: unknown;
  reason: string;
  status: string;
  created_at: unknown;
}): Refund {
  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.order_number,
    userId: row.user_id,
    amount: asNumber(row.amount),
    reason: row.reason,
    status: row.status as RefundStatus,
    createdAt: asIso(row.created_at),
  };
}

export type { Collection };
