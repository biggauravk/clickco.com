import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminDialog } from "@/components/admin/admin-dialog";
import { authClient, authEnabled } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { alert } = useAdminDialog();
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((mode === "up" && name.trim().length < 1) || !email.trim() || password.length < 8) {
      await alert({ title: "Required Information", description: mode === "up" ? "Please enter your name, email, and a password of at least 8 characters." : "Please enter your email and a password of at least 8 characters." });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({ name, email, password });
        if (err) throw new Error(err.message ?? "Could not create account");
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(err.message ?? "Could not sign in");
      }
      await nav({ to: "/account" });
    } catch (ex) {
      const message = ex instanceof Error ? ex.message : "Something went wrong. Please try again.";
      setError(null);
      await alert({ title: "Sign-in failed", description: message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[calc(100dvh-4rem)] items-center px-5 py-16 md:min-h-[calc(100dvh-4.5rem)] md:px-10">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight">{mode === "in" ? "Sign in" : "Create account"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">For orders, refunds, and reviews.</p>
        {authEnabled ? (
          <>
            <form className="mt-8 w-full space-y-4" onSubmit={onSubmit} noValidate>
            {mode === "up" ? (
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            ) : null}
            <div>
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
            </Button>
            </form>
            <button
              type="button"
              className="mt-4 text-sm text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
            >
              {mode === "in" ? "Need an account?" : "Already have an account?"}
            </button>
          </>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">Sign-in is disabled.</p>
        )}
      </div>
    </main>
  );
}
