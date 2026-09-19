import type { Collection, OrderStatus, RefundStatus } from "./constants";

export type Brand = {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  productCount: number;
};

export type Product = {
  id: number;
  brandId: number;
  brandName: string;
  brandSlug: string;
  name: string;
  slug: string;
  collection: Collection;
  shortDescription: string;
  fullDescription: string;
  price: number;
  discountPercent: number;
  sellingPrice: number;
  stock: number;
  images: string[];
  videoUrl: string | null;
  videoPosterUrl: string | null;
  videoAspectRatio: number | null;
  featured: boolean;
  createdAt: string;
};

export type Review = {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  authorName: string;
  rating: number;
  body: string;
  createdAt: string;
  userId: string;
};

export type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string;
};

export type Order = {
  id: number;
  orderNumber: string;
  userId: string;
  customerEmail: string;
  total: number;
  status: OrderStatus;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  createdAt: string;
  items: OrderItem[];
};

export type Refund = {
  id: number;
  orderId: number;
  orderNumber: string;
  userId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  createdAt: string;
};

export type HomeData = {
  brands: Brand[];
  films: Product[];
  featured: Product[];
  menTop: Product[];
  womenTop: Product[];
  mosaic: Product[];
  reviews: Review[];
};

export type AdminOverview = {
  liveProducts: number;
  totalOrders: number;
  revenue: number;
  lowStockCount: number;
  inventory: Array<{
    id: number;
    name: string;
    collection: Collection;
    stock: number;
    sellingPrice: number;
  }>;
};
