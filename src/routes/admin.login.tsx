import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminDialog } from "@/components/admin/admin-dialog";
import { adminLogin } from "@/lib/store/admin";

export const Route = createFileRoute("/admin/login")({ component: AdminLoginPage });

function AdminLoginPage() {
  const navigate = useNavigate();
  const { alert } = useAdminDialog();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await adminLogin({ data: { email, password } });
      await navigate({ to: "/admin" });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not sign in.";
      setError(null);
      await alert({ title: "Sign-in failed", description: message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-5 py-16 text-foreground">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-7 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Owner access</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Admin panel</h1>
          <p className="mt-2 text-sm text-muted-foreground">For orders, refunds, and reviews.</p>
        </div>
        <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" /></div>
        <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" /></div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Open admin panel"}</Button>
        <a href="/" className="block text-center text-sm text-muted-foreground hover:underline">Return to store</a>
      </form>
    </main>
  );
}
