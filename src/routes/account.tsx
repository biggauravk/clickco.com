import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminDialog } from "@/components/admin/admin-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { listMyOrders, listMyRefunds, requestRefund } from "@/lib/store/account";
import { formatDate, formatInr } from "@/lib/store/format";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const { alert } = useAdminDialog();
  const { user, isPending } = useCurrentUserState();
  const qc = useQueryClient();
  const orders = useQuery({ queryKey: ["my-orders"], queryFn: () => listMyOrders(), enabled: !!user });
  const refunds = useQuery({ queryKey: ["my-refunds"], queryFn: () => listMyRefunds(), enabled: !!user });
  const [reason, setReason] = useState<Record<number, string>>({});

  const mut = useMutation({
    mutationFn: (orderId: number) => requestRefund({ data: { orderId, reason: reason[orderId] ?? "" } }),
    onSuccess: async () => {
      await alert({ title: "Refund request submitted", description: "Your refund request was submitted successfully." });
      await qc.invalidateQueries({ queryKey: ["my-orders"] });
      await qc.invalidateQueries({ queryKey: ["my-refunds"] });
    },
    onError: (e) => void alert({ title: "Refund request failed", description: e instanceof Error ? e.message : "Something went wrong. Please try again." }),
  });

  if (isPending) return <div className="h-40" />;
  if (!user) return <RedirectToSignIn />;

  return (
    <main className="mx-auto max-w-3xl px-5 py-12 md:py-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Account</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">{user.displayName ?? "You"}</h1>
        </div>
        <UserButton />
      </div>

      <h2 className="mt-14 text-xl tracking-tight">Orders</h2>
      <ul className="mt-6 space-y-6">
        {(orders.data ?? []).map((o) => {
          const canRefund = ["paid", "packed", "shipped", "delivered"].includes(o.status);
          return (
            <li key={o.id} className="rounded-xl bg-card p-5 ring-1 ring-foreground/8">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium tracking-tight">{o.orderNumber}</p>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{o.status}</p>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDate(o.createdAt)} · {formatInr(o.total)}
              </p>
              <ul className="mt-3 text-sm text-muted-foreground">
                {o.items.map((i) => (
                  <li key={i.id}>
                    {i.productName} × {i.quantity}
                  </li>
                ))}
              </ul>
              {canRefund ? (
                <div className="mt-4 space-y-3">
                  <Textarea
                    placeholder="Reason for refund"
                    value={reason[o.id] ?? ""}
                    onChange={(e) => setReason((r) => ({ ...r, [o.id]: e.target.value }))}
                  />
                  <Button variant="secondary" size="sm" onClick={() => mut.mutate(o.id)} disabled={mut.isPending}>
                    Request refund
                  </Button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      {(orders.data ?? []).length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No orders yet.</p> : null}

      <h2 className="mt-14 text-xl tracking-tight">Refunds</h2>
      <ul className="mt-6 space-y-4">
        {(refunds.data ?? []).map((r) => (
          <li key={r.id} className="flex justify-between gap-4 text-sm">
            <span>
              {r.orderNumber} · {formatInr(r.amount)}
            </span>
            <span className="uppercase tracking-[0.14em] text-muted-foreground">{r.status}</span>
          </li>
        ))}
      </ul>
      {(refunds.data ?? []).length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No refund requests.</p> : null}
    </main>
  );
}
