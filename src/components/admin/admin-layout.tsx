import { Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useAdminDialog } from "@/components/admin/admin-dialog";
import { AdminShell } from "@/components/admin/admin-shell";
import { adminLogout, getAdminSession } from "@/lib/store/admin";

export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { confirm } = useAdminDialog();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  useEffect(() => {
    void getAdminSession().then((session) => setEmail(session.email)).catch(() => setUnauthorized(true)).finally(() => setLoading(false));
  }, []);
  if (unauthorized) return <Navigate to="/admin/login" />;
  if (loading || !email) return <main className="grid min-h-dvh place-items-center text-sm text-muted-foreground">Loading admin panel…</main>;
  async function signOut() { if (!await confirm({ title: "Logout", description: "Are you sure you want to log out of the Admin Panel?", confirmLabel: "Log out", cancelLabel: "Cancel" })) return; await adminLogout(); await navigate({ to: "/admin/login" }); }
  return <AdminShell email={email} onSignOut={() => void signOut()}>{children}</AdminShell>;
}
