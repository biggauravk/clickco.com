import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FilmStrip } from "@/components/storefront/film-strip";
import { ProductCard } from "@/components/storefront/product-card";
import { Reveal } from "@/components/storefront/reveal";
import { getHomeData } from "@/lib/store/catalog";
import { SITE } from "@/lib/store/constants";
import { ABOUT } from "@/lib/store/about-content";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { data, isPending } = useQuery({ queryKey: ["home"], queryFn: () => getHomeData() });

  return (
    <main>
      <FilmStrip films={data?.films ?? []} />

      <section className="px-5 pb-8 pt-16 md:px-10 md:pt-24">
        <Reveal>
          <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)] md:items-center">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">The House</p>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] md:text-6xl lg:text-7xl">
                {SITE.tagline}
              </h1>
              <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-muted-foreground">{SITE.support}</p>
              <Link
                to="/watches"
                className="mt-10 inline-flex h-12 items-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity duration-150 hover:opacity-90"
              >
                Explore collection
              </Link>
            </div>
            <div className="overflow-hidden rounded-xl bg-card">
              <img
                src="/about/founder-portrait-placeholder.svg"
                alt="Sahil Watch Co."
                className="aspect-[4/5] h-full w-full object-cover"
              />
            </div>
          </div>
        </Reveal>
      </section>

      <section className="px-5 py-10 md:px-10">
        <Reveal>
          <div className="mb-10 flex items-end justify-between">
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl">Watches Across the House</h2>
            <Link to="/brands" className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
              All brands
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-7">
            {(data?.brands ?? []).map((brand) => (
              <Link key={brand.id} to="/brands/$slug" params={{ slug: brand.slug }} className="group text-center">
                <div className="mx-auto grid aspect-square max-w-24 place-items-center rounded-full bg-card ring-1 ring-foreground/8 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]">
                  <img src={brand.imageUrl} alt={`${brand.name} logo`} className="size-12 rounded-full bg-muted object-contain object-center" />
                </div>
                <p className="mt-3 text-sm tracking-tight">{brand.name}</p>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="px-5 py-20 md:px-10">
        <Reveal>
          <div className="mb-10 flex items-end justify-between">
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl">Featured Watches</h2>
            <Link to="/watches" className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
              All watches
            </Link>
          </div>
          <div className="grid grid-cols-2 justify-items-center gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {(isPending ? [] : data?.featured ?? []).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Reveal>
      </section>

      <section className="px-5 py-20 md:px-10">
        <Reveal>
          <div className="mb-10 flex items-end justify-between">
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl">Top 7 for Men</h2>
            <Link to="/men" className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
              All men
            </Link>
          </div>
          <div className="grid grid-cols-2 justify-items-center gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {(isPending ? [] : data?.menTop ?? []).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Reveal>
      </section>

      <section className="px-5 py-10 md:px-10 md:py-20">
        <Reveal>
          <div className="mb-10 flex items-end justify-between">
            <h2 className="text-3xl font-medium tracking-tight md:text-4xl">Top 7 for Women</h2>
            <Link to="/women" className="text-[12px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
              All women
            </Link>
          </div>
          <div className="grid grid-cols-2 justify-items-center gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {(isPending ? [] : data?.womenTop ?? []).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Reveal>
      </section>

      <section className="px-5 py-16 md:px-10">
        <Reveal>
          <h2 className="mb-8 text-3xl font-medium tracking-tight md:text-4xl">Collection of Watches</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {(data?.mosaic ?? []).map((p) => (
              <Link key={p.id} to="/watches" className="group relative aspect-[4/5] overflow-hidden rounded-xl bg-card">
                <img
                  src={p.images[0]}
                  alt={p.name}
                  className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                />
              </Link>
            ))}
          </div>
          <p className="mt-4 text-[12px] uppercase tracking-[0.16em] text-muted-foreground">Tap any image to see every watch</p>
        </Reveal>
      </section>

      <section className="grid gap-10 px-5 py-20 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)] md:items-end md:px-10 md:py-28">
        <Reveal className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-muted-foreground">About Sahil Watch Co.</p>
          <h2 className="mt-4 text-3xl font-medium tracking-tight md:text-5xl">A family legacy, keeping time for generations.</h2>
          <p className="mt-6 text-base font-light leading-relaxed text-muted-foreground">{ABOUT.positioning}</p>
          <p className="mt-5 text-base font-light leading-relaxed text-muted-foreground">{ABOUT.about[2]}</p>
          <Link to="/about" className="mt-8 inline-flex text-[12px] uppercase tracking-[0.16em] underline-offset-4 hover:underline">Read our story</Link>
        </Reveal>
        <Reveal className="border-l border-border pl-6"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Founded by</p><p className="mt-3 text-xl font-medium">{ABOUT.founder.name}</p><p className="mt-1 text-sm text-muted-foreground">Watchmaker · 1981</p><p className="mt-5 text-sm font-light leading-relaxed text-muted-foreground">{ABOUT.founder.bio}</p></Reveal>
      </section>

      <section className="px-5 py-20 md:px-10">
        <Reveal>
          <h2 className="text-3xl font-medium tracking-tight md:text-4xl">From the Wrist</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {(data?.reviews ?? []).map((r) => (
              <blockquote key={r.id} className="rounded-xl bg-card p-6 ring-1 ring-foreground/8">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {"●".repeat(r.rating)}
                  <span className="ml-2 text-muted-foreground/60">{r.productName}</span>
                </p>
                <p className="mt-4 text-sm font-light leading-relaxed">{r.body}</p>
                <footer className="mt-5 text-sm text-muted-foreground">{r.authorName}</footer>
              </blockquote>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="px-5 py-16 md:px-10">
        <Reveal>
          <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Premium quality", "Finishing you can feel. Cases that hold up."],
              ["Authentic products", "Only brands created in this house."],
              ["Exceptional service", "WhatsApp, the atelier, a real person."],
              ["Easy ordering", "Bag, checkout, done. No extra steps."],
            ].map(([t, d]) => (
              <li key={t}>
                <p className="text-sm font-medium tracking-tight">{t}</p>
                <p className="mt-2 text-sm font-light text-muted-foreground">{d}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      <section className="px-5 py-24 text-center md:px-10">
        <Reveal>
          <h2 className="text-3xl font-medium tracking-tight md:text-5xl">Ready to experience the difference?</h2>
          <Link
            to="/watches"
            className="mt-8 inline-flex h-12 items-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground"
          >
            Shop now
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
