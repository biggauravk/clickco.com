import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import type { Product } from "@/lib/store/types";

export function FilmStrip({ films }: { films: Product[] }) {
  if (!films.length) return null;
  return (
    <section className="relative pt-16 md:pt-20" aria-label="Product videos">
      <div className="mb-6 flex items-end justify-between px-5 md:px-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Videos</p>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{films.length} pieces</p>
      </div>
      <div className="film-mask flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:gap-6 md:px-10">
        {films.map((film) => (
          <FilmCard key={film.id} film={film} />
        ))}
      </div>
    </section>
  );
}

function FilmCard({ film }: { film: Product }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) void el.play().catch(() => undefined);
        else el.pause();
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Link
      to="/product/$slug"
      params={{ slug: film.slug }}
      className={`group relative shrink-0 snap-center overflow-hidden rounded-xl bg-card ${film.videoAspectRatio != null && film.videoAspectRatio < 1 ? "w-[58vw] md:w-[30vw] lg:w-[22vw]" : "w-[90vw] max-w-[380px] md:w-[60vw] md:max-w-[900px]"}`}
    >
      <div style={{ aspectRatio: film.videoAspectRatio != null && film.videoAspectRatio < 1 ? "9 / 16" : "16 / 9" }}>
        <video
          ref={ref}
          className="h-full w-full object-contain transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
          src={film.videoUrl ?? undefined}
          poster={film.videoPosterUrl ?? film.images[0]}
          muted
          loop
          playsInline
          preload="metadata"
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent px-5 py-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/70">{film.brandName}</p>
        <p className="mt-1 text-lg tracking-tight text-foreground">{film.name}</p>
      </div>
    </Link>
  );
}
