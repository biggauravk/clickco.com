import { createHmac, timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { asNumber } from "@/lib/utils";
import { sellingPrice } from "./format";

const razorpayKeyId = process.env.RAZORPAY_KEY_ID?.trim();
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
const quoteSecret = process.env.BETTER_AUTH_SECRET?.trim() || process.env.JWT_SECRET?.trim();
const checkoutConfigId = process.env.RAZORPAY_CHECKOUT_CONFIG_ID?.trim();
const RAZORPAY_API = "https://api.razorpay.com/v1";
const DELIVERY_CHARGE = 0;

// Delivery is generally available across the listed states and UTs; final coverage can vary by PIN code.
// Excluded from checkout: Andaman and Nicobar Islands, Dadra and Nagar Haveli and Daman and Diu, Lakshadweep, and Ladakh.
export const INDIAN_STATES = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Chandigarh", "Delhi", "Jammu and Kashmir", "Puducherry"] as const;

const itemsSchema = z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().min(1).max(20) })).min(1).max(30);
export const deliverySchema = z.object({
  fullName: z.string().trim().min(3).max(80).regex(/^[A-Za-z]+(?:[ .'-]+[A-Za-z]+)+$/, "Enter your full name using first and last name."),
  mobile: z.string().trim().regex(/^(?:\+91[\s-]?)?[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number."),
  houseNumber: z.string().trim().min(1).max(40).regex(/^[A-Za-z0-9][A-Za-z0-9 .\-/#,]*$/, "Enter a valid house, flat, unit, or shop number."),
  building: z.string().trim().min(2).max(120).regex(/[A-Za-z]/, "Enter the building, apartment, society, or shop name."),
  street: z.string().trim().min(3).max(160).regex(/[A-Za-z]/, "Enter a meaningful street, locality, or area."),
  landmark: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().min(2).max(80).regex(/^[A-Za-z][A-Za-z .'-]+$/, "Enter a valid city."),
  state: z.enum(INDIAN_STATES),
  pinCode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit Indian PIN code."),
});
export type DeliveryDetails = z.infer<typeof deliverySchema>;

function normalizeMobile(value: string) { return value.replace(/[\s-]/g, "").replace(/^\+91/, ""); }
export function formatDeliveryAddress(delivery: DeliveryDetails): string {
  return [
    `House/Flat/Shop: ${delivery.houseNumber}`,
    `Building/Apartment/Society: ${delivery.building}`,
    `Street/Locality/Area: ${delivery.street}`,
    delivery.landmark ? `Landmark: ${delivery.landmark}` : null,
    `City: ${delivery.city}`,
    `State: ${delivery.state}`,
    `PIN Code: ${delivery.pinCode}`,
  ].filter(Boolean).join(", ");
}

function requireRazorpay(): { keyId: string; secret: string; quoteSecret: string } {
  if (!razorpayKeyId || !razorpayKeySecret || !quoteSecret) {
    throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and BETTER_AUTH_SECRET in the deployment environment.");
  }
  return { keyId: razorpayKeyId, secret: razorpayKeySecret, quoteSecret };
}

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function decode<T>(value: string): T {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
}

function signQuote(payload: Record<string, unknown>, secret: string): string {
  const body = encode(payload);
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyQuote<T extends Record<string, unknown>>(token: string, secret: string): T {
  const [body, signature] = token.split(".");
  if (!body || !signature) throw new Error("The payment quote is invalid. Please start checkout again.");
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error("The payment quote is invalid. Please start checkout again.");
  const payload = decode<T>(body);
  if (typeof payload.expiresAt !== "number" || payload.expiresAt < Date.now()) throw new Error("The payment quote expired. Please start checkout again.");
  return payload;
}

async function razorpayRequest<T>(path: string, init: RequestInit, secret: string): Promise<T> {
  const response = await fetch(`${RAZORPAY_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${razorpayKeyId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const payload = (await response.json()) as T & { error?: { description?: string } };
  if (!response.ok) throw new Error(payload.error?.description || "Razorpay request failed.");
  return payload;
}

type QuoteLine = { productId: number; name: string; unitPrice: number; listPrice: number; discountPercent: number; quantity: number; lineTotal: number; imageUrl: string };
type RazorpayOrder = { id: string; amount: number; currency: string; status: string };
type RazorpayPayment = { id: string; order_id: string; amount: number; currency: string; status: string };

async function getQuote(items: Array<{ productId: number; quantity: number }>): Promise<{ total: number; lines: QuoteLine[] }> {
  const sql = await getSql();
  const quantities = new Map(items.map((item) => [item.productId, item.quantity]));
  const ids = [...quantities.keys()];
  const rows = await sql.query<{ id: number; name: string; price: unknown; discount_percent: unknown; stock: unknown; images: unknown }>(
    `select id, name, price, discount_percent, stock, images from products where id in (${ids.map((_, i) => `$${i + 1}`).join(",")})`, ids,
  );
  if (rows.length !== ids.length) throw new Error("A watch in your bag is no longer listed.");
  let total = 0;
  const lines: QuoteLine[] = [];
  for (const row of rows) {
    const quantity = quantities.get(row.id) ?? 0;
    const stock = asNumber(row.stock);
    if (quantity > stock) throw new Error(`${row.name} does not have enough stock.`);
    const listPrice = asNumber(row.price);
    const discountPercent = asNumber(row.discount_percent);
    const unitPrice = sellingPrice(listPrice, discountPercent);
    const lineTotal = unitPrice * quantity;
    let imageUrl = "";
    try { imageUrl = (JSON.parse(String(row.images || "[]")) as string[])[0] ?? ""; } catch { imageUrl = ""; }
    total += lineTotal;
    lines.push({ productId: row.id, name: row.name, unitPrice, listPrice, discountPercent, quantity, lineTotal, imageUrl });
  }
  return { total: total + DELIVERY_CHARGE, lines };
}

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ items: itemsSchema, customer: deliverySchema }))
  .handler(async ({ context, data }) => {
    const { keyId, secret, quoteSecret } = requireRazorpay();
    const quote = await getQuote(data.items);
    const amount = Math.round(quote.total * 100);
    if (!Number.isSafeInteger(amount) || amount < 100) throw new Error("The payment amount is invalid.");
    const receipt = `meridian-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`.slice(0, 40);
    let paymentOrder: RazorpayOrder;
    try {
      paymentOrder = await razorpayRequest<RazorpayOrder>("/orders", {
        method: "POST",
        body: JSON.stringify({
          amount,
          currency: "INR",
          receipt,
          partial_payment: false,
          ...(checkoutConfigId ? { checkout_config_id: checkoutConfigId } : {}),
          notes: { customer_id: context.userId, delivery_pin: data.customer.pinCode },
        }),
      }, secret);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Razorpay could not create the payment order.";
      if (/amount exceeds (the )?maximum amount allowed|per-order maximum/i.test(message)) {
        throw new Error("This amount is above the maximum per-order limit enabled for this Razorpay account. Increase the account transaction limit in Razorpay Dashboard or contact Razorpay support. The Admin Panel price was not changed.");
      }
      throw error;
    }
    const quoteToken = signQuote({ userId: context.userId, orderId: paymentOrder.id, amount, deliveryCharge: DELIVERY_CHARGE, delivery: data.customer, items: quote.lines, expiresAt: Date.now() + 15 * 60 * 1000 }, quoteSecret);
    return { keyId, orderId: paymentOrder.id, amount, currency: "INR", quoteToken, lines: quote.lines, deliveryCharge: DELIVERY_CHARGE, checkoutConfigId: checkoutConfigId || null };
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({
    razorpayOrderId: z.string().min(8).max(64),
    razorpayPaymentId: z.string().min(8).max(64),
    razorpaySignature: z.string().min(16).max(128),
    quoteToken: z.string().min(20).max(5000),
    customer: deliverySchema,
  }))
  .handler(async ({ context, data }) => {
    const { secret, quoteSecret } = requireRazorpay();
    const quote = verifyQuote<{ userId: string; orderId: string; amount: number; deliveryCharge: number; delivery: DeliveryDetails; items: QuoteLine[] }>(data.quoteToken, quoteSecret);
    if (quote.userId !== context.userId || quote.orderId !== data.razorpayOrderId) throw new Error("The payment quote does not match this customer or order.");
    if (JSON.stringify(quote.delivery) !== JSON.stringify(data.customer)) throw new Error("The delivery details changed during payment. Please start checkout again.");
    const expectedSignature = createHmac("sha256", secret).update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`).digest("hex");
    const actual = Buffer.from(data.razorpaySignature, "utf8");
    const expected = Buffer.from(expectedSignature, "utf8");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("Payment verification failed.");

    const remoteOrder = await razorpayRequest<RazorpayOrder>(`/orders/${encodeURIComponent(data.razorpayOrderId)}`, { method: "GET" }, secret);
    const payment = await razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(data.razorpayPaymentId)}`, { method: "GET" }, secret);
    if (remoteOrder.id !== data.razorpayOrderId || remoteOrder.amount !== quote.amount || remoteOrder.currency !== "INR") throw new Error("The Razorpay order amount could not be verified.");
    if (payment.order_id !== data.razorpayOrderId || payment.amount !== quote.amount || payment.currency !== "INR" || payment.status !== "captured") throw new Error("Payment has not been captured by Razorpay.");

    const sql = await getSql();
    const result = await sql.transaction(async (tx) => {
      const users = await tx<{ email: string | null }>`select email from "user" where id = ${context.userId} limit 1`;
      const ids = quote.items.map((line) => line.productId);
      const rows = await tx.query<{ id: number; stock: unknown }>(`select id, stock from products where id in (${ids.map((_, i) => `$${i + 1}`).join(",")}) order by id for update`, ids);
      if (rows.length !== ids.length) throw new Error("A watch in your bag is no longer listed.");
      for (const line of quote.items) if (line.quantity > asNumber(rows.find((row) => row.id === line.productId)?.stock)) throw new Error(`${line.name} does not have enough stock.`);
      // Derive the local order number from Razorpay's unique order ID so a repeated
      // success callback cannot create a second local order without a schema change.
      const orderNumber = `MRD-${new Date().getFullYear()}-${data.razorpayOrderId}`.slice(0, 40);
      const existing = await tx<{ id: number; order_number: string }>`select id, order_number from orders where order_number = ${orderNumber} and user_id = ${context.userId} limit 1`;
      if (existing[0]) return { orderId: existing[0].id, orderNumber: existing[0].order_number };
      const inserted = await tx<{ id: number }>`insert into orders (order_number, user_id, customer_email, total, status, shipping_name, shipping_phone, shipping_address) values (${orderNumber}, ${context.userId}, ${users[0]?.email || "customer@meridian.watch"}, ${quote.amount / 100}, 'paid', ${data.customer.fullName.trim()}, ${normalizeMobile(data.customer.mobile)}, ${formatDeliveryAddress(data.customer)}) returning id`;
      const orderId = inserted[0]?.id;
      if (!orderId) throw new Error("Could not create the order.");
      for (const line of quote.items) {
        await tx`insert into order_items (order_id, product_id, product_name, unit_price, quantity, image_url) values (${orderId}, ${line.productId}, ${line.name}, ${line.unitPrice}, ${line.quantity}, ${line.imageUrl})`;
        await tx`update products set stock = stock - ${line.quantity} where id = ${line.productId}`;
      }
      return { orderId, orderNumber };
    });
    return result;
  });
