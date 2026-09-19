import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { WatchGrid } from "@/components/storefront/watch-grid";
import { useWishlist } from "@/lib/store/cart";
import { getProductsByIds } from "@/lib/store/catalog";

export const Route = createFileRoute("/wishlist")({ component: WishlistPage });

function WishlistPage() {
  const ids = useWishlist((s) => s.ids);
  const { data, isPending } = useQuery({
    queryKey: ["wishlist", ids],
    queryFn: () => getProductsByIds({ data: { ids } }),
    enabled: ids.length > 0,
  });
  return (
    <WatchGrid
      title="Saved"
      kicker="Wishlist"
      products={ids.length ? (data ?? []) : []}
      pending={ids.length > 0 && isPending}
    />
  );
}
