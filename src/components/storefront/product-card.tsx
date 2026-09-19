import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { LOW_STOCK_AT } from "@/lib/store/constants";
import { useWishlist } from "@/lib/store/cart";
import type { Product } from "@/lib/store/types";
import { cn } from "@/lib/utils";
import { Price } from "./price";

export function ProductCard({ product, className }: { product: Product; className?: string }) {
  const wished = useWishlist((s) => s.ids.includes(product.id));
  const toggle = useWishlist((s) => s.toggle);
  const image = product.images[0] ?? "";
  const low = product.stock > 0 && product.stock < LOW_STOCK_AT;

  return (
    <article className={cn("group relative w-full max-w-[280px]", className)}>
      <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-muted">
          {image ? (
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-contain object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
            />
          ) : null}
          {product.discountPercent > 0 ? (
            <span className="absolute left-3 top-3 rounded-full bg-background/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-foreground backdrop-blur-sm">
              {product.discountPercent}% off
            </span>
          ) : null}
          {product.stock < 1 ? (
            <span className="absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.16em] text-foreground/80">
              Out of stock
            </span>
          ) : low ? (
            <span className="absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.16em] text-foreground/80">
              Few left
            </span>
          ) : null}
        </div>
        <div className="mt-4 space-y-1">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{product.brandName}</p>
          <h3 className="text-[15px] font-medium tracking-tight text-foreground">{product.name}</h3>
          <Price price={product.price} selling={product.sellingPrice} discount={product.discountPercent} className="text-sm" />
        </div>
      </Link>
      <button
        type="button"
        aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(product.id);
        }}
        className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-background/55 text-foreground backdrop-blur-sm transition-opacity duration-150 hover:opacity-100"
      >
        <Heart className={cn("size-4", wished && "fill-foreground")} />
      </button>
    </article>
  );
}
