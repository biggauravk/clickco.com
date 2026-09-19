import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { WatchGrid } from "@/components/storefront/watch-grid";
import { getBrandBySlug } from "@/lib/store/catalog";

export const Route = createFileRoute("/brands/$slug")({ component: BrandPage });

function BrandPage() {
  const { slug } = Route.useParams();
  const { data, isPending } = useQuery({
    queryKey: ["brand", slug],
    queryFn: () => getBrandBySlug({ data: { slug } }),
  });
  if (!isPending && !data?.brand) {
    return (
      <main className="px-5 py-24 text-center">
        <h1 className="text-3xl tracking-tight">Brand not found</h1>
      </main>
    );
  }
  return (
    <WatchGrid
      title={data?.brand?.name ?? "Brand"}
      kicker="Men’s and women’s watches from this brand"
      products={data?.products ?? []}
      pending={isPending}
    />
  );
}
