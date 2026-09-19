import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cartTotal, useCart } from "@/lib/store/cart";
import { formatInr } from "@/lib/store/format";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const total = cartTotal(items);

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 md:py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Bag</h1>
      {items.length === 0 ? (
        <p className="mt-8 text-muted-foreground">
          Empty.{" "}
          <Link to="/watches" className="underline-offset-4 hover:underline">
            See the collection
          </Link>
        </p>
      ) : (
        <ul className="mt-10 space-y-6">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-4">
              <Link to="/product/$slug" params={{ slug: item.slug }} className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                {item.image ? <img src={item.image} alt={item.name} className="h-full w-full object-contain object-center" /> : null}
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{item.brandName}</p>
                <p className="tracking-tight">{item.name}</p>
                <p className="mt-1 text-sm tabular-nums">{formatInr(item.unitPrice)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={item.stock}
                    value={item.quantity}
                    onChange={(e) => setQty(item.productId, Number(e.target.value))}
                    className="h-10 w-16 rounded-md bg-foreground/5 px-2 text-sm tabular-nums ring-1 ring-foreground/12"
                  />
                  <button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => remove(item.productId)}>
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {items.length > 0 ? (
        <div className="mt-12 flex items-center justify-between border-t border-border pt-6">
          <p className="text-lg tabular-nums">{formatInr(total)}</p>
          <Link to="/checkout">
            <Button size="lg">Checkout</Button>
          </Link>
        </div>
      ) : null}
    </main>
  );
}
