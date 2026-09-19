import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAdminDialog } from "@/components/admin/admin-dialog";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminPage, AdminState, formatDate, formatInr } from "@/components/admin/admin-utils";
import { adminListRefunds, adminSetRefundStatus } from "@/lib/store/admin";
import { REFUND_STATUSES, type RefundStatus } from "@/lib/store/constants";
import type { Refund } from "@/lib/store/types";

export const Route = createFileRoute("/admin/refunds")({ component: AdminRefundsPage });

function AdminRefundsPage() {
  const { alert } = useAdminDialog();
  const [refunds, setRefunds] = useState<Refund[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<unknown>(null);
  async function load() { setLoading(true); try { setRefunds(await adminListRefunds()); setError(null); } catch (e) { setError(e); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  async function change(id: number, status: RefundStatus) { try { await adminSetRefundStatus({ data: { id, status } }); await alert({ title: "Refund status updated", description: "The refund status was updated successfully." }); await load(); } catch (e) { await alert({ title: "Refund status update failed", description: e instanceof Error ? e.message : "Something went wrong. Please try again." }); } }
  return <AdminLayout><AdminPage title="Refunds"><p className="text-sm text-muted-foreground">Review refund requests and update their status.</p><AdminState loading={loading} error={error}><div className="space-y-4">{refunds.map((refund) => <article key={refund.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-medium">Refund request {refund.id} · Order {refund.orderNumber} <span className="text-sm font-normal text-muted-foreground">(order ID {refund.orderId})</span></p><p className="mt-1 text-sm text-muted-foreground">Requested {formatDate(refund.createdAt)} · User {refund.userId}</p><p className="mt-3 max-w-2xl text-sm">{refund.reason}</p></div><div className="text-right"><p className="text-lg font-medium">{formatInr(refund.amount)}</p><select className="mt-2 h-9 rounded-md border border-input bg-background px-2 text-sm capitalize" value={refund.status} onChange={(e) => void change(refund.id, e.target.value as RefundStatus)}>{REFUND_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></div></div></article>)}{refunds.length === 0 ? <p className="rounded-2xl border border-border p-6 text-sm text-muted-foreground">No refund requests.</p> : null}</div></AdminState></AdminPage></AdminLayout>;
}
