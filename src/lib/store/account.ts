import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { mapOrder, mapOrderItem, mapRefund } from "./map";
import { asNumber } from "@/lib/utils";
import { sellingPrice } from "./format";

function orderNumber(): string {
  const n = Math.floor(1000 + Math.random() * 9000);
  const y = new Date().getFullYear();
  return `MRD-${y}-${n}`;
}

function uniqueOrderNumber(): string {
  return `${orderNumber()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      name: z.string().min(2).max(80),
      phone: z.string().min(8).max(20),
      address: z.string().min(8).max(240),
      items: z
        .array(
          z.object({
            productId: z.number().int().positive(),
            quantity: z.number().int().min(1).max(20),
          }),
        )
        .min(1)
        .max(30),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const qtyById = new Map(data.items.map((i) => [i.productId, i.quantity]));
    const ids = [...qtyById.keys()];
    return sql.transaction(async (tx) => {
      const users = await tx<{ email: string | null }>`
        select email from "user" where id = ${context.userId} limit 1
      `;
      const email = users[0]?.email || "customer@meridian.watch";
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
      const products = await tx.query<{
        id: number;
        name: string;
        price: unknown;
        discount_percent: unknown;
        stock: unknown;
        images: unknown;
      }>(
        `select id, name, price, discount_percent, stock, images from products where id in (${placeholders}) order by id for update`,
        ids,
      );
      if (products.length !== ids.length) throw new Error("A watch in your bag is no longer listed.");

      let total = 0;
      const lines: Array<{ productId: number; name: string; unit: number; qty: number; image: string }> = [];
      for (const p of products) {
        const qty = qtyById.get(p.id) ?? 0;
        const stock = asNumber(p.stock);
        if (qty < 1 || qty > stock) throw new Error(`${p.name} does not have enough stock.`);
        const unit = sellingPrice(asNumber(p.price), asNumber(p.discount_percent));
        total += unit * qty;
        let image = "";
        try { image = (JSON.parse(String(p.images || "[]")) as string[])[0] ?? ""; } catch { image = ""; }
        lines.push({ productId: p.id, name: p.name, unit, qty, image });
      }

      const number = uniqueOrderNumber();
      const inserted = await tx<{ id: number }>`
        insert into orders (
          order_number, user_id, customer_email, total, status,
          shipping_name, shipping_phone, shipping_address
        ) values (
          ${number}, ${context.userId}, ${email}, ${total}, 'paid',
          ${data.name.trim()}, ${data.phone.trim()}, ${data.address.trim()}
        )
        returning id
      `;
      const orderId = inserted[0]?.id;
      if (!orderId) throw new Error("Could not create the order.");
      for (const line of lines) {
        await tx`
          insert into order_items (order_id, product_id, product_name, unit_price, quantity, image_url)
          values (${orderId}, ${line.productId}, ${line.name}, ${line.unit}, ${line.qty}, ${line.image})
        `;
        await tx`update products set stock = stock - ${line.qty} where id = ${line.productId}`;
      }
      return { orderId, orderNumber: number };
    });
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const orders = await sql<{
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
    }>`
      select * from orders where user_id = ${context.userId} order by created_at desc
    `;
    const result = [];
    for (const o of orders) {
      const items = await sql<Parameters<typeof mapOrderItem>[0]>`
        select id, product_id, product_name, unit_price, quantity, image_url
        from order_items where order_id = ${o.id}
      `;
      result.push(mapOrder(o, items.map(mapOrderItem)));
    }
    return result;
  });

export const requestRefund = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      orderId: z.number().int().positive(),
      reason: z.string().min(8).max(400),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const orders = await sql<{ id: number; total: unknown; status: string }>`
      select id, total, status from orders where id = ${data.orderId} and user_id = ${context.userId} limit 1
    `;
    const order = orders[0];
    if (!order) throw new Error("Order not found.");
    const eligible = ["paid", "packed", "shipped", "delivered"].includes(order.status);
    if (!eligible) throw new Error("This order cannot be refunded.");
    const existing = await sql<{ id: number }>`
      select id from refunds
      where order_id = ${order.id} and status in ('requested','approved','processed')
      limit 1
    `;
    if (existing[0]) throw new Error("A refund is already in progress for this order.");
    await sql`
      insert into refunds (order_id, user_id, amount, reason, status)
      values (${order.id}, ${context.userId}, ${asNumber(order.total)}, ${data.reason.trim()}, 'requested')
    `;
    return { ok: true };
  });

export const listMyRefunds = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const rows = await sql<Parameters<typeof mapRefund>[0]>`
      select r.id, r.order_id, o.order_number, r.user_id, r.amount, r.reason, r.status, r.created_at
      from refunds r join orders o on o.id = r.order_id
      where r.user_id = ${context.userId}
      order by r.created_at desc
    `;
    return rows.map(mapRefund);
  });

export const submitReview = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      productId: z.number().int().positive(),
      rating: z.number().int().min(1).max(5),
      body: z.string().min(8).max(600),
      authorName: z.string().min(2).max(60),
    }),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const products = await sql<{ id: number }>`select id from products where id = ${data.productId} limit 1`;
    if (!products[0]) throw new Error("Watch not found.");
    await sql`
      insert into reviews (product_id, user_id, author_name, rating, body)
      values (${data.productId}, ${context.userId}, ${data.authorName.trim()}, ${data.rating}, ${data.body.trim()})
      on conflict (product_id, user_id)
      do update set rating = excluded.rating, body = excluded.body, author_name = excluded.author_name
    `;
    return { ok: true };
  });
