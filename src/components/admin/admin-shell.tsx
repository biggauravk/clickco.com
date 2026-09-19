import { Link, useRouterState } from "@tanstack/react-router";
import { Image, LayoutDashboard, LogOut, Package, RotateCcw, Store, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/store/constants";

const nav = [
  { to: "/admin" as const, label: "Overview", icon: LayoutDashboard },
  { to: "/admin/products" as const, label: "Products", icon: Package },
  { to: "/admin/orders" as const, label: "Orders", icon: Store },
  { to: "/admin/refunds" as const, label: "Refunds", icon: RotateCcw },
  { to: "/admin/brands" as const, label: "Brands", icon: Tag },
  { to: "/admin/media" as const, label: "Media", icon: Image },
];

export function AdminShell({
  email,
  onSignOut,
  children,
}: {
  email: string;
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-dvh bg-background text-foreground md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-[#33312E] bg-[#0F0E0D] text-[#E8E8E8] md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-5 md:block">
          <p className="text-[12px] font-semibold uppercase tracking-[0.26em]">{SITE.name}</p>
          <p className="hidden text-xs text-[#BBBAB9] md:mt-2 md:block">Admin</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-3">
          {nav.map((item) => {
            const active = item.to === "/admin" ? pathname === "/admin" : pathname.startsWith(item.to);
            return (
              <a
                key={item.to}
                href={item.to}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-[#D1D1D0] transition-colors duration-150 hover:bg-[#1C1A17] hover:text-[#8379FF]",
                  active && "bg-[#1C1A17] text-[#FFFFFF]",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="hidden px-4 pb-6 md:block">
          <a
            href="/"
            className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-[#D1D1D0] hover:text-[#8379FF]"
          >
            View store
          </a>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-sm text-[#D1D1D0] hover:text-[#8379FF]"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
          <p className="mt-4 truncate px-3 text-[11px] text-[#BBBAB9]">{email}</p>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center justify-end gap-3 border-b border-[#33312E] bg-[#0F0E0D] px-5 py-3 text-[#E8E8E8] md:hidden">
          <a href="/" className="text-sm text-[#D1D1D0] hover:text-[#8379FF]">
            View store
          </a>
          <button type="button" onClick={onSignOut} className="text-sm text-[#D1D1D0] hover:text-[#8379FF]">
            Sign out
          </button>
        </div>
        <div className="px-5 py-8 md:px-10 md:py-10">{children}</div>
      </div>
    </div>
  );
}
