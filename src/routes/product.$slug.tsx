import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useState } from "react";
import { useAdminDialog } from "@/components/admin/admin-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Price } from "@/components/storefront/price";
import { SignedIn, SignedOut } from "@/lib/auth/gates";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { submitReview } from "@/lib/store/account";
import { useCart, useWishlist } from "@/lib/store/cart";
import { getProductBySlug } from "@/lib/store/catalog";
import { LOW_STOCK_AT } from "@/lib/store/constants";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({ component: ProductPage });

function ProductPage() {
  const { alert } = useAdminDialog();
  const { slug } = Route.useParams();
  const { data, isPending } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProductBySlug({ data: { slug } }),
  });
  const product = data?.product;
  const [active, setActive] = useState(0);
  const add = useCart((s) => s.add);
  const wished = useWishlist((s) => (product ? s.ids.includes(product.id) : false));
  const toggle = useWishlist((s) => s.toggle);

  if (isPending) {
    return <div className="mx-auto max-w-6xl px-5 py-16"><div className="aspect-[4/5] animate-pulse rounded-xl bg-card md:aspect-[16/10]" /></div>;
  }
  if (!product) {
    return (
      <main className="px-5 py-24 text-center">
        <h1 className="text-3xl tracking-tight">Watch not found</h1>
        <Link to="/watches" className="mt-6 inline-block text-sm underline-offset-4 hover:underline">
          All watches
        </Link>
      </main>
    );
  }

  const images = product.images.length ? product.images : [];
  const img = images[Math.min(active, images.length - 1)];
  const low = product.stock > 0 && product.stock < LOW_STOCK_AT;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 md:px-10 md:py-16">
      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="w-full max-w-[560px]">
          <div className="aspect-[3/4] overflow-hidden rounded-xl bg-muted">
            {img ? <img src={img} alt={product.name} className="h-full w-full object-contain object-center" /> : null}
          </div>
          {images.length > 1 ? (
            <div className="mt-3 flex gap-2">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActive(i)}
                    className={cn("aspect-[3/4] w-12 overflow-hidden rounded-md bg-muted ring-1 ring-foreground/10 sm:w-14", i === active && "ring-2 ring-foreground/50")}
                >
                  <img src={src} alt={`${product.name} image ${i + 1}`} className="h-full w-full object-contain object-center" />
                </button>
              ))}
            </div>
          ) : null}
          {product.videoUrl ? (
            <div className="mt-6 overflow-hidden rounded-xl bg-card" style={{ aspectRatio: product.videoAspectRatio != null && product.videoAspectRatio < 1 ? "9 / 16" : "16 / 9" }}>
              <video
                className="h-full w-full object-contain"
                src={product.videoUrl}
                poster={product.videoPosterUrl ?? undefined}
                controls
                playsInline
                preload="metadata"
              />
            </div>
          ) : null}
        </div>
        <div>
          <Link to="/brands/$slug" params={{ slug: product.brandSlug }} className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {product.brandName}
          </Link>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">{product.name}</h1>
          <p className="mt-4 max-w-md text-base font-light leading-relaxed text-muted-foreground">{product.shortDescription}</p>
          <div className="mt-6">
            <Price price={product.price} selling={product.sellingPrice} discount={product.discountPercent} className="text-xl" />
          </div>
          <p className="mt-3 text-[12px] uppercase tracking-[0.16em] text-muted-foreground">
            {product.stock < 1 ? "Out of stock" : low ? `Only ${product.stock} left` : "In stock"}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              disabled={product.stock < 1}
              onClick={async () => {
                add({
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  brandName: product.brandName,
                  image: product.images[0] ?? "",
                  unitPrice: product.sellingPrice,
                  listPrice: product.price,
                  discountPercent: product.discountPercent,
                  stock: product.stock,
                });
                await alert({ title: "Added to bag", description: `${product.name} was added to your bag.` });
              }}
            >
              Add to bag
            </Button>
            <Button variant="secondary" size="lg" onClick={() => toggle(product.id)}>
              <Heart className={cn("size-4", wished && "fill-foreground")} />
              {wished ? "Saved" : "Save"}
            </Button>
          </div>
          <p className="mt-10 max-w-md text-sm font-light leading-relaxed text-muted-foreground">{product.fullDescription}</p>
        </div>
      </div>

      <section className="mt-20">
        <h2 className="text-2xl font-medium tracking-tight">Reviews</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {(data?.reviews ?? []).map((r) => (
            <blockquote key={r.id} className="rounded-xl bg-card p-5 ring-1 ring-foreground/8">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{r.rating} / 5</p>
              <p className="mt-3 text-sm font-light leading-relaxed">{r.body}</p>
              <footer className="mt-4 text-sm text-muted-foreground">{r.authorName}</footer>
            </blockquote>
          ))}
        </div>
        <SignedIn>
          <ReviewForm productId={product.id} slug={product.slug} />
        </SignedIn>
        <SignedOut>
          <p className="mt-8 text-sm text-muted-foreground">
            <Link to="/login" className="underline-offset-4 hover:underline">
              Sign in
            </Link>{" "}
            to leave a review.
          </p>
        </SignedOut>
      </section>
    </main>
  );
}

function ReviewForm({ productId, slug }: { productId: number; slug: string }) {
  const { alert } = useAdminDialog();
  const user = useCurrentUser();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const mut = useMutation({
    mutationFn: () =>
      submitReview({
        data: {
          productId,
          rating,
          body,
          authorName: user?.displayName || user?.primaryEmail || "Customer",
        },
      }),
    onSuccess: async () => {
      await alert({ title: "Review published", description: "Your review was saved successfully." });
      setBody("");
      await qc.invalidateQueries({ queryKey: ["product", slug] });
      await qc.invalidateQueries({ queryKey: ["home"] });
    },
    onError: (e) => void alert({ title: "Review submission failed", description: e instanceof Error ? e.message : "Something went wrong. Please try again." }),
  });
  return (
    <form
      className="mt-10 max-w-lg space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (body.trim().length < 8) {
          void alert({ title: "Required Information", description: "Please write at least 8 characters before publishing your review." });
          return;
        }
        mut.mutate();
      }}
      noValidate
    >
      <Label>Your review</Label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={cn("size-11 rounded-lg ring-1 ring-foreground/15 text-sm", n <= rating && "bg-foreground/10")}
          >
            {n}
          </button>
        ))}
      </div>
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} minLength={8} maxLength={600} required />
      <Button type="submit" disabled={mut.isPending}>
        {mut.isPending ? "Saving…" : "Publish review"}
      </Button>
    </form>
  );
}
