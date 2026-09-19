import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql } from "@/lib/db";
import { mapBrand, mapProduct, mapReview, type ProductRow } from "./map";
import { PRODUCT_SELECT } from "./sql";
import type { HomeData, Product } from "./types";

export const getHomeData = createServerFn({ method: "GET" }).handler(async (): Promise<HomeData> => {
  const sql = await getSql();

  const brandRows = await sql<Parameters<typeof mapBrand>[0]>`
    select b.id, b.name, b.slug, b.description, b.image_url,
      (select count(*) from products p where p.brand_id = b.id)::int as product_count
    from brands b
    order by b.name
  `;

  const filmRows = await sql.query<ProductRow>(
    `select ${PRODUCT_SELECT} from products p join brands b on b.id = p.brand_id
     where p.video_url is not null and trim(p.video_url) <> ''
     order by p.created_at desc`,
  );

  const featuredRows = await sql.query<ProductRow>(
    `select ${PRODUCT_SELECT} from products p join brands b on b.id = p.brand_id
     where p.featured = true and p.stock > 0
     order by p.created_at desc`,
  );

  const menRows = await sql.query<ProductRow>(
    `select ${PRODUCT_SELECT} from products p join brands b on b.id = p.brand_id
     where p.collection = 'men' and p.featured = true
     order by p.created_at desc limit 7`,
  );

  const womenRows = await sql.query<ProductRow>(
    `select ${PRODUCT_SELECT} from products p join brands b on b.id = p.brand_id
     where p.collection = 'women' and p.featured = true
     order by p.created_at desc limit 7`,
  );

  const mosaicRows = await sql.query<ProductRow>(
    `select ${PRODUCT_SELECT} from products p join brands b on b.id = p.brand_id
     where p.images is not null and p.images <> '[]'
     order by p.id asc limit 8`,
  );

  const reviewRows = await sql.query<Parameters<typeof mapReview>[0]>(
    `select r.id, r.product_id, p.name as product_name, p.slug as product_slug,
            r.author_name, r.rating, r.body, r.created_at, r.user_id
     from reviews r join products p on p.id = r.product_id
     order by r.created_at desc limit 8`,
  );

  return {
    brands: brandRows.map(mapBrand),
    films: filmRows.map(mapProduct),
    featured: featuredRows.map(mapProduct),
    menTop: menRows.map(mapProduct),
    womenTop: womenRows.map(mapProduct),
    mosaic: mosaicRows.map(mapProduct),
    reviews: reviewRows.map(mapReview),
  };
});

export const listBrands = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql();
  const rows = await sql<Parameters<typeof mapBrand>[0]>`
    select b.id, b.name, b.slug, b.description, b.image_url,
      (select count(*) from products p where p.brand_id = b.id)::int as product_count
    from brands b
    order by b.name
  `;
  return rows.map(mapBrand);
});

export const listProducts = createServerFn({ method: "GET" })
  .validator(
    z.object({
      collection: z.enum(["men", "women"]).optional(),
      brandSlug: z.string().optional(),
      search: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<Product[]> => {
    const sql = await getSql();
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (data.collection) {
      params.push(data.collection);
      clauses.push(`p.collection = $${params.length}`);
    }
    if (data.brandSlug) {
      params.push(data.brandSlug);
      clauses.push(`b.slug = $${params.length}`);
    }
    if (data.search?.trim()) {
      params.push(`%${data.search.trim()}%`);
      const i = params.length;
      clauses.push(`(p.name ilike $${i} or b.name ilike $${i} or p.short_description ilike $${i})`);
    }
    const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
    const rows = await sql.query<ProductRow>(
      `select ${PRODUCT_SELECT} from products p join brands b on b.id = p.brand_id
       ${where} order by p.created_at desc`,
      params,
    );
    return rows.map(mapProduct);
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const rows = await sql.query<ProductRow>(
      `select ${PRODUCT_SELECT} from products p join brands b on b.id = p.brand_id where p.slug = $1 limit 1`,
      [data.slug],
    );
    const product = rows[0] ? mapProduct(rows[0]) : null;
    if (!product) return { product: null, reviews: [] as ReturnType<typeof mapReview>[] };
    const reviews = await sql.query<Parameters<typeof mapReview>[0]>(
      `select r.id, r.product_id, p.name as product_name, p.slug as product_slug,
              r.author_name, r.rating, r.body, r.created_at, r.user_id
       from reviews r join products p on p.id = r.product_id
       where r.product_id = $1
       order by r.created_at desc`,
      [product.id],
    );
    return { product, reviews: reviews.map(mapReview) };
  });

export const getBrandBySlug = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const sql = await getSql();
    const brands = await sql<Parameters<typeof mapBrand>[0]>`
      select b.id, b.name, b.slug, b.description, b.image_url,
        (select count(*) from products p where p.brand_id = b.id)::int as product_count
      from brands b where b.slug = ${data.slug} limit 1
    `;
    const brand = brands[0] ? mapBrand(brands[0]) : null;
    if (!brand) return { brand: null, products: [] as Product[] };
    const products = await sql.query<ProductRow>(
      `select ${PRODUCT_SELECT} from products p join brands b on b.id = p.brand_id
       where b.slug = $1 order by p.created_at desc`,
      [data.slug],
    );
    return { brand, products: products.map(mapProduct) };
  });

export const getProductsByIds = createServerFn({ method: "GET" })
  .validator(z.object({ ids: z.array(z.number()) }))
  .handler(async ({ data }) => {
    if (!data.ids.length) return [] as Product[];
    const sql = await getSql();
    const rows = await sql.query<ProductRow>(
      `select ${PRODUCT_SELECT} from products p join brands b on b.id = p.brand_id
       where p.id in (${data.ids.map((_, i) => `$${i + 1}`).join(",")})`,
      data.ids,
    );
    return rows.map(mapProduct);
  });
