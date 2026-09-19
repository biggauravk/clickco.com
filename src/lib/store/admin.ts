import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { adminMiddleware } from "./admin-middleware";
import { asNumber } from "@/lib/utils";
import { slugify } from "@/lib/utils";
import { LOW_STOCK_AT, ORDER_STATUSES, REFUND_STATUSES } from "./constants";
import { sellingPrice } from "./format";
import { mapBrand, mapOrder, mapOrderItem, mapProduct, mapRefund, type ProductRow } from "./map";
import { PRODUCT_SELECT } from "./sql";
import { validateBrandInput, validateProductInput, type BrandInput, type ProductInput } from "./validation";
import type { AdminOverview, Product } from "./types";

export const adminLogin = createServerFn({ method: "POST" })
  .validator(z.object({ email: z.string(), password: z.string() }))
  .handler(async ({ data }) => {
    const auth = await import("./admin-auth.server");
    if (!auth.credentialsMatch(data.email, data.password)) {
      throw new Error("Invalid owner email or password.");
    }
    const token = await auth.signAdminToken(auth.ownerEmail());
    await auth.writeAdminCookie(token);
    return { email: auth.ownerEmail() };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const auth = await import("./admin-auth.server");
  await auth.clearAdminCookie();
  return { ok: true };
});

export const getAdminSession = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async ({ context }) => context.admin);

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async (): Promise<AdminOverview> => {
    const sql = await getSql();
    const live = await sql<{ n: number }>`select count(*)::int as n from products where stock > 0`;
    const orders = await sql<{ n: number }>`select count(*)::int as n from orders`;
    const revenue = await sql<{ n: unknown }>`
      select coalesce(sum(total), 0) as n from orders where status not in ('cancelled','refunded')
    `;
    const low = await sql<{ n: number }>`select count(*)::int as n from products where stock < ${LOW_STOCK_AT}`;
    const inventory = await sql<{
      id: number;
      name: string;
      collection: "men" | "women";
      stock: unknown;
      price: unknown;
      discount_percent: unknown;
    }>`
      select id, name, collection, stock, price, discount_percent
      from products
      order by stock asc, name asc
    `;
    return {
      liveProducts: live[0]?.n ?? 0,
      totalOrders: orders[0]?.n ?? 0,
      revenue: asNumber(revenue[0]?.n),
      lowStockCount: low[0]?.n ?? 0,
      inventory: inventory.map((p) => ({
        id: p.id,
        name: p.name,
        collection: p.collection,
        stock: asNumber(p.stock),
        sellingPrice: sellingPrice(asNumber(p.price), asNumber(p.discount_percent)),
      })),
    };
  });

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .validator(z.object({ search: z.string().optional() }))
  .handler(async ({ data }): Promise<Product[]> => {
    const sql = await getSql();
    const q = data.search?.trim();
    const rows = q
      ? await sql.query<ProductRow>(
          `select ${PRODUCT_SELECT} from products p join brands b on b.id = p.brand_id
           where p.name ilike $1 or b.name ilike $1 or p.short_description ilike $1
           order by p.created_at desc`,
          [`%${q}%`],
        )
      : await sql.query<ProductRow>(
          `select ${PRODUCT_SELECT} from products p join brands b on b.id = p.brand_id
           order by p.created_at desc`,
        );
    return rows.map(mapProduct);
  });

export const adminGetProduct = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query<ProductRow>(
      `select ${PRODUCT_SELECT} from products p join brands b on b.id = p.brand_id where p.id = $1`,
      [data.id],
    );
    return rows[0] ? mapProduct(rows[0]) : null;
  });

const productPayload = z.object({
  name: z.string(),
  brandId: z.number(),
  collection: z.enum(["men", "women"]),
  shortDescription: z.string(),
  fullDescription: z.string(),
  price: z.number(),
  discountPercent: z.number(),
  stock: z.number(),
  images: z.array(z.string()),
  videoUrl: z.string(),
  videoPosterUrl: z.string(),
  featured: z.boolean(),
});

async function uniqueProductSlug(sql: Awaited<ReturnType<typeof getSql>>, name: string, ignoreId?: number) {
  const base = slugify(name) || "watch";
  let slug = base;
  let i = 2;
  for (;;) {
    const rows = ignoreId
      ? await sql<{ id: number }>`select id from products where slug = ${slug} and id <> ${ignoreId} limit 1`
      : await sql<{ id: number }>`select id from products where slug = ${slug} limit 1`;
    if (!rows[0]) return slug;
    slug = `${base}-${i}`;
    i += 1;
    if (i > 80) return `${base}-${Date.now()}`;
  }
}

export const adminCreateProduct = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(productPayload)
  .handler(async ({ data }) => {
    const err = validateProductInput(data as ProductInput);
    if (err) throw new Error(err);
    const sql = await getSql();
    const brands = await sql<{ id: number }>`select id from brands where id = ${data.brandId} limit 1`;
    if (!brands[0]) throw new Error("Brand not found. Create the brand first.");
    const slug = await uniqueProductSlug(sql, data.name);
    const images = JSON.stringify(data.images.map((i) => i.trim()).filter(Boolean).slice(0, 5));
    const video = data.videoUrl.trim() || null;
    const poster = data.videoPosterUrl.trim() || null;
    const rows = await sql<{ id: number }>`
      insert into products (
        brand_id, name, slug, collection, short_description, full_description,
        price, discount_percent, stock, images, video_url, video_poster_url, featured
      ) values (
        ${data.brandId}, ${data.name.trim()}, ${slug}, ${data.collection},
        ${data.shortDescription.trim()}, ${data.fullDescription.trim()},
        ${data.price}, ${data.discountPercent}, ${data.stock}, ${images},
        ${video}, ${poster}, ${data.featured}
      )
      returning id
    `;
    return { id: rows[0].id, slug };
  });

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(productPayload.extend({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const err = validateProductInput(data);
    if (err) throw new Error(err);
    const sql = await getSql();
    const brands = await sql<{ id: number }>`select id from brands where id = ${data.brandId} limit 1`;
    if (!brands[0]) throw new Error("Brand not found.");
    const images = JSON.stringify(data.images.map((i) => i.trim()).filter(Boolean).slice(0, 5));
    const video = data.videoUrl.trim() || null;
    const poster = data.videoPosterUrl.trim() || null;
    await sql`
      update products set
        brand_id = ${data.brandId},
        name = ${data.name.trim()},
        collection = ${data.collection},
        short_description = ${data.shortDescription.trim()},
        full_description = ${data.fullDescription.trim()},
        price = ${data.price},
        discount_percent = ${data.discountPercent},
        stock = ${data.stock},
        images = ${images},
        video_url = ${video},
        video_poster_url = ${poster},
        featured = ${data.featured}
      where id = ${data.id}
    `;
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`delete from products where id = ${data.id}`;
    return { ok: true };
  });

export const adminUpdateStock = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(z.object({ id: z.number().int().positive(), stock: z.number().int().min(1).max(1000) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`update products set stock = ${data.stock} where id = ${data.id}`;
    return { ok: true };
  });

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const sql = await getSql();
    const orders = await sql<Parameters<typeof mapOrder>[0]>`
      select id, order_number, user_id, customer_email, total, status,
             shipping_name, shipping_phone, shipping_address, created_at
      from orders order by created_at desc
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

export const adminSetOrderStatus = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(z.object({ id: z.number().int().positive(), status: z.enum(ORDER_STATUSES) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const current = await sql<{ id: number; status: string }>`
      select id, status from orders where id = ${data.id} limit 1
    `;
    const order = current[0];
    if (!order) throw new Error("Order not found.");
    if (["cancelled", "refunded"].includes(order.status) && data.status !== order.status) {
      throw new Error("Cancelled or refunded orders cannot be moved back to another status.");
    }
    await sql`update orders set status = ${data.status} where id = ${data.id}`;
    if (data.status === "cancelled" && !["cancelled", "refunded"].includes(order.status)) {
      const items = await sql<{ product_id: number; quantity: number }>`
        select product_id, quantity from order_items where order_id = ${data.id}
      `;
      for (const item of items) {
        await sql`update products set stock = stock + ${item.quantity} where id = ${item.product_id}`;
      }
    }
    return { ok: true };
  });

export const adminListRefunds = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const sql = await getSql();
    const rows = await sql<Parameters<typeof mapRefund>[0]>`
      select r.id, r.order_id, o.order_number, r.user_id, r.amount, r.reason, r.status, r.created_at
      from refunds r join orders o on o.id = r.order_id
      order by r.created_at desc
    `;
    return rows.map(mapRefund);
  });

export const adminSetRefundStatus = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(z.object({ id: z.number().int().positive(), status: z.enum(REFUND_STATUSES) }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql<{ id: number; order_id: number; status: string }>`
      select id, order_id, status from refunds where id = ${data.id} limit 1
    `;
    const refund = rows[0];
    if (!refund) throw new Error("Refund not found.");
    if (refund.status === "processed" && data.status !== "processed") {
      throw new Error("Processed refunds cannot be moved back to another status.");
    }
    await sql`update refunds set status = ${data.status} where id = ${data.id}`;
    if (data.status === "processed" && refund.status !== "processed") {
      const order = await sql<{ status: string }>`select status from orders where id = ${refund.order_id} limit 1`;
      if (order[0] && !["refunded", "cancelled"].includes(order[0].status)) {
        const items = await sql<{ product_id: number; quantity: number }>`
          select product_id, quantity from order_items where order_id = ${refund.order_id}
        `;
        for (const item of items) {
          await sql`update products set stock = stock + ${item.quantity} where id = ${item.product_id}`;
        }
      }
      await sql`update orders set status = 'refunded' where id = ${refund.order_id}`;
    }
    return { ok: true };
  });

export const adminListBrands = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    const sql = await getSql();
    const rows = await sql<Parameters<typeof mapBrand>[0]>`
      select b.id, b.name, b.slug, b.description, b.image_url,
        (select count(*) from products p where p.brand_id = b.id)::int as product_count
      from brands b order by b.name
    `;
    return rows.map(mapBrand);
  });

const brandPayload = z.object({
  name: z.string(),
  description: z.string(),
  imageUrl: z.string(),
});

export const adminCreateBrand = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(brandPayload)
  .handler(async ({ data }) => {
    const err = validateBrandInput(data as BrandInput);
    if (err) throw new Error(err);
    const sql = await getSql();
    const base = slugify(data.name) || "brand";
    let slug = base;
    let i = 2;
    for (;;) {
      const exists = await sql<{ id: number }>`select id from brands where slug = ${slug} limit 1`;
      if (!exists[0]) break;
      slug = `${base}-${i}`;
      i += 1;
    }
    const rows = await sql<{ id: number }>`
      insert into brands (name, slug, description, image_url)
      values (${data.name.trim()}, ${slug}, ${data.description.trim()}, ${data.imageUrl.trim()})
      returning id
    `;
    return { id: rows[0].id, slug };
  });

export const adminUpdateBrand = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(brandPayload.extend({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const err = validateBrandInput(data);
    if (err) throw new Error(err);
    const sql = await getSql();
    await sql`
      update brands set
        name = ${data.name.trim()},
        description = ${data.description.trim()},
        image_url = ${data.imageUrl.trim()}
      where id = ${data.id}
    `;
    return { ok: true };
  });

export const adminDeleteBrand = createServerFn({ method: "POST" })
  .middleware([adminMiddleware])
  .validator(z.object({ id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const linked = await sql<{ n: number }>`select count(*)::int as n from products where brand_id = ${data.id}`;
    if ((linked[0]?.n ?? 0) > 0) {
      throw new Error("Move or delete this brand’s watches first.");
    }
    await sql`delete from brands where id = ${data.id}`;
    return { ok: true };
  });
