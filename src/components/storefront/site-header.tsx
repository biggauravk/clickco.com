import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Menu, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { cartCount, useCart, useWishlist } from "@/lib/store/cart";
import { SITE } from "@/lib/store/constants";
import { cn } from "@/lib/utils";

const links = [
  { to: "/men" as const, label: "Men" },
  { to: "/women" as const, label: "Women" },
  { to: "/brands" as const, label: "Brands" },
  { to: "/watches" as const, label: "Watches" },
  { to: "/about" as const, label: "About" },
];

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = useCart((s) => s.items);
  const wishes = useWishlist((s) => s.ids.length);
  const count = cartCount(items);
  const { isPending } = useCurrentUserState();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-[#0F0E0D] text-[#E8E8E8] transition-[background-color,box-shadow] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]",
        scrolled ? "shadow-[0_1px_0_0_rgb(51_49_46_/_100%)] backdrop-blur-md" : "",
      )}
    >
      <div className="flex min-h-16 items-center gap-2 px-4 sm:px-5 md:grid md:h-[4.5rem] md:grid-cols-[1fr_auto_1fr] md:gap-4 md:px-10">
        <Link to="/" className="min-w-0 flex-1 text-[10px] font-semibold leading-[1.08] tracking-[0.1em] uppercase sm:max-w-[155px] md:max-w-none md:flex-none md:text-[15px] md:leading-[1.15] md:tracking-[0.28em]">
          <span className="md:hidden">SAHIL WATCH CO.<br />TIMEMACHINE</span>
          <span className="hidden md:inline">{SITE.name}</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "text-[12px] uppercase tracking-[0.18em] text-[#D1D1D0] transition-colors duration-150 hover:text-[#8379FF]",
                pathname === l.to && "text-[#FFFFFF]",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center justify-self-end gap-0 sm:gap-1">
          <Link to="/wishlist" aria-label="Wishlist" className="relative grid size-11 place-items-center">
            <Heart className="size-4" />
            {wishes > 0 ? (
              <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-[#FFFFFF] px-1 text-center text-[10px] text-[#0F0E0D]">
                {wishes}
              </span>
            ) : null}
          </Link>
          <Link to="/cart" aria-label="Bag" className="relative grid size-11 place-items-center">
            <ShoppingBag className="size-4" />
            {count > 0 ? (
              <span className="absolute right-1.5 top-1.5 min-w-4 rounded-full bg-[#FFFFFF] px-1 text-center text-[10px] text-[#0F0E0D] tabular-nums">
                {count}
              </span>
            ) : null}
          </Link>
          <div className="hidden md:block">
            {isPending ? (
              <div className="size-8 animate-pulse rounded-full bg-white/10" />
            ) : (
              <>
                <SignedIn>
                  <Link to="/account" className="text-[12px] uppercase tracking-[0.16em] text-[#D1D1D0] hover:text-[#8379FF]">
                    Account
                  </Link>
                </SignedIn>
                <SignedOut>
                  <Link to="/login" aria-label="Sign in" className="grid size-11 place-items-center">
                    <User className="size-4" />
                  </Link>
                </SignedOut>
              </>
            )}
          </div>
          <button
            type="button"
            className="grid size-11 place-items-center md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-[#33312E] bg-[#1C1A17] px-5 py-5 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="flex min-h-11 items-center text-2xl tracking-tight">
                {l.label}
              </Link>
            ))}
            <SignedIn>
              <Link to="/account" className="flex min-h-11 items-center text-2xl tracking-tight">
                Account
              </Link>
              <UserButton />
            </SignedIn>
            <SignedOut>
              <Link to="/login" className="flex min-h-11 items-center text-2xl tracking-tight">
                Sign in
              </Link>
            </SignedOut>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
