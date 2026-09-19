import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { WatchGrid } from "@/components/storefront/watch-grid";
import { listProducts } from "@/lib/store/catalog";

export const Route = createFileRoute("/women")({ component: WomenPage });

function WomenPage() {
  const { data, isPending } = useQuery({
    queryKey: ["watches", "women"],
    queryFn: () => listProducts({ data: { collection: "women" } }),
  });
  return <WatchGrid title="Women" kicker="Women’s watches across all brands" products={data ?? []} pending={isPending} />;
}
