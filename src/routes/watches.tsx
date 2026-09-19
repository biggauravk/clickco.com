import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { WatchGrid } from "@/components/storefront/watch-grid";
import { listProducts } from "@/lib/store/catalog";

export const Route = createFileRoute("/watches")({ component: WatchesPage });

function WatchesPage() {
  const { data, isPending } = useQuery({ queryKey: ["watches"], queryFn: () => listProducts({ data: {} }) });
  return <WatchGrid title="All watches" kicker="Across the house" products={data ?? []} pending={isPending} />;
}
