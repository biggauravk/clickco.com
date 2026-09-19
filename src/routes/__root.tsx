import { createServerFn } from "@tanstack/react-start";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, HeadContent, Outlet, Scripts, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { AdminDialogProvider } from "@/components/admin/admin-dialog";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { AuthProvider } from "@/lib/auth/provider";
import { SITE } from "@/lib/store/constants";
import appCss from "../styles.css?url";

const fetchSessionUser = createServerFn({ method: "GET" }).handler(async () => {
  const { getSessionUser } = await import("@/lib/auth/verify.server");
  const u = await getSessionUser();
  return u ? { id: u.id, email: u.email } : null;
});

export const Route = createRootRoute({
  beforeLoad: async () => ({ sessionUser: await fetchSessionUser() }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: `${SITE.name} — ${SITE.tagline}` },
      { name: "theme-color", content: "#FFFFFF" },
      { name: "description", content: "A house for watches worth keeping. Premium quality. Thoughtfully designed." },
      { property: "og:image", content: "/og.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/og.jpg" },
    ],
    links: [
      { rel: "icon", type: "image/jpeg", href: "/favicon.jpg" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap",
      },
    ],
  }),
  component: Root,
});

function Root() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 20_000, retry: 1 } },
      }),
  );

  return (
    <html lang="en" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-dvh bg-background text-foreground">
        <AdminDialogProvider><QueryClientProvider client={queryClient}>
          <AuthProvider>
            {isAdmin ? (
              <Outlet />
            ) : (
              <>
                <SiteHeader />
                <Outlet />
                <SiteFooter />
              </>
            )}
          </AuthProvider>
        </QueryClientProvider></AdminDialogProvider>
        <Scripts />
      </body>
    </html>
  );
}
