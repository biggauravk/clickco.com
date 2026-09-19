import { useState, type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { authEnabled, signOut } from "./client";
import { useCurrentUser, useCurrentUserState } from "./use-current-user";

export const SIGN_IN_PATH = "/login";
export function SignedIn({ children }: { children: ReactNode }) {
  const { user } = useCurrentUserState();
  return user ? <>{children}</> : null;
}
export function SignedOut({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending || user) return null;
  return <>{children}</>;
}
export function RedirectToSignIn({ to = SIGN_IN_PATH }: { to?: string }) {
  return <Navigate to={to} />;
}
export function SignInGate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return null;
  return user ? <>{children}</> : <>{fallback ?? <Navigate to="/login" />}</>;
}
export function SignInButtons() {
  return <Navigate to="/login" />;
}
export function UserButton() {
  const user = useCurrentUser();
  const [signingOut, setSigningOut] = useState(false);
  if (!user) return null;
  const label = user.displayName ?? user.primaryEmail ?? "Account";
  return (
    <div className="flex items-center gap-2">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-foreground/10 text-sm font-medium">{label.charAt(0).toUpperCase()}</span>
      <span className="text-sm font-medium">{label}</span>
      {authEnabled ? (
        <button type="button" disabled={signingOut} onClick={() => { setSigningOut(true); void signOut().catch(() => setSigningOut(false)); }} className="cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait">
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      ) : null}
    </div>
  );
}
