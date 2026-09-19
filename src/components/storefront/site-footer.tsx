import { Link } from "@tanstack/react-router";
import { SITE } from "@/lib/store/constants";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[#33312E] bg-[#1C1A17] text-[#E8E8E8]">
      <div className="grid gap-12 px-5 py-16 md:grid-cols-4 md:px-10">
        <div className="md:col-span-2">
          <p className="text-[15px] font-semibold uppercase tracking-[0.28em]">{SITE.name}</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#BBBAB9]">
            A house for watches worth keeping. Brands we choose. Pieces we stand behind.
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#D1D1D0]">Visit</p>
          <p className="mt-3 text-sm leading-relaxed text-[#E8E8E8]">{SITE.location}</p>
          <p className="mt-1 text-sm text-[#BBBAB9]">{SITE.hours}</p>
          <a href={SITE.whatsappHref} className="mt-2 inline-flex min-h-11 items-center text-sm text-[#E8E8E8] underline-offset-4 hover:underline">
            WhatsApp {SITE.whatsapp}
          </a>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#D1D1D0]">Connect</p>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <a href={SITE.instagram} className="inline-flex min-h-11 items-center underline-offset-4 hover:underline">
              Instagram
            </a>
          </div>
          <img src="/qr.jpg" alt="WhatsApp QR" className="mt-6 size-28 rounded-lg" />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#33312E] bg-[#000000] px-5 py-5 text-[11px] uppercase tracking-[0.16em] text-[#BBBAB9] md:px-10">
        <span>© {new Date().getFullYear()} {SITE.name}</span>
        <div className="flex flex-wrap gap-x-5 gap-y-1">
          <Link to="/watches" className="inline-flex min-h-11 items-center">All watches</Link>
          <Link to="/brands" className="inline-flex min-h-11 items-center">Brands</Link>
          <Link to="/about" className="inline-flex min-h-11 items-center">About</Link>
        </div>
      </div>
    </footer>
  );
}
