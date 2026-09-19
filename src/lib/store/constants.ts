export const SITE = {
  name: "Sahil Watch Co. TIMEMACHINE",
  tagline: "A Family-Owned Multibrand Watch Retail Chain · Since 1985, New Delhi",
  support: "Authentic timepieces, premium accessories, and trusted in-house after-sales service.",
  location: "Showroom No. 29-30, DDA Market, Jail Road, Janakpuri, New Delhi 110018",
  hours: "Mon–Tue & Thu–Sun, 10:30 AM–9:00 PM · Closed Wednesdays",
  whatsapp: "+91 88001 97697",
  whatsappHref: "https://wa.me/918800197697",
  email: "",
  instagram: "https://www.instagram.com/timemachinedelhi",
  x: "",
} as const;

export const LOW_STOCK_AT = 8;

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const REFUND_STATUSES = [
  "requested",
  "approved",
  "processed",
  "rejected",
] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const COLLECTIONS = ["men", "women"] as const;
export type Collection = (typeof COLLECTIONS)[number];
