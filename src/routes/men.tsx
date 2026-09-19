import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { WatchGrid } from "@/components/storefront/watch-grid";
import { listProducts } from "@/lib/store/catalog";

export const Route = createFileRoute("/men")({ component: MenPage });

function MenPage() {
  const { data, isPending } = useQuery({
    queryKey: ["watches", "men"],
    queryFn: () => listProducts({ data: { collection: "men" } }),
  });
  return <WatchGrid title="Men" kicker="Men’s watches across all brands" products={data ?? []} pending={isPending} />;
}
