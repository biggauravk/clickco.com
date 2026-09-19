import { ProductCard } from "@/components/storefront/product-card";
import type { Product } from "@/lib/store/types";

export function WatchGrid({
  title,
  kicker,
  products,
  pending,
}: {
  title: string;
  kicker?: string;
  products: Product[];
  pending?: boolean;
}) {
  return (
    <main className="px-5 py-12 md:px-10 md:py-16">
      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">{kicker ?? "Collection"}</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{title}</h1>
      <div className="mt-12 grid grid-cols-2 justify-items-center gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
        {pending
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-card" />
            ))
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      {!pending && products.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">Nothing here yet.</p>
      ) : null}
    </main>
  );
}
