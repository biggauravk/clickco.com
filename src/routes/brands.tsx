import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { listBrands } from "@/lib/store/catalog";

export const Route = createFileRoute("/brands")({ component: BrandsPage });

function BrandsPage() {
  const { data } = useQuery({ queryKey: ["brands"], queryFn: () => listBrands() });
  return (
    <main className="px-5 py-12 md:px-10 md:py-16">
      <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">Directory</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">Brands</h1>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((b) => (
          <Link
            key={b.id}
            to="/brands/$slug"
            params={{ slug: b.slug }}
            className="group rounded-xl bg-card p-6 ring-1 ring-foreground/8 transition-transform duration-500 hover:scale-[1.01]"
          >
            <img src={b.imageUrl} alt={`${b.name} logo`} className="size-12 rounded-lg bg-muted object-contain object-center" />
            <h2 className="mt-6 text-2xl tracking-tight">{b.name}</h2>
            <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">{b.description}</p>
            <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{b.productCount} watches</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
