import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAdminDialog } from "@/components/admin/admin-dialog";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminPage, AdminState, formatDate, formatInr } from "@/components/admin/admin-utils";
import { adminListOrders, adminSetOrderStatus } from "@/lib/store/admin";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/store/constants";
import type { Order } from "@/lib/store/types";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrdersPage });

function AdminOrdersPage() {
  const { alert } = useAdminDialog();
  const [orders, setOrders] = useState<Order[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<unknown>(null);
  async function load() { setLoading(true); try { setOrders(await adminListOrders()); setError(null); } catch (e) { setError(e); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  async function change(id: number, status: OrderStatus) { try { await adminSetOrderStatus({ data: { id, status } }); await alert({ title: "Order status updated", description: "The order status was updated successfully." }); await load(); } catch (e) { await alert({ title: "Order status update failed", description: e instanceof Error ? e.message : "Something went wrong. Please try again." }); } }
  return <AdminLayout><AdminPage title="Orders"><AdminState loading={loading} error={error}><div className="space-y-4">{orders.map((order) => <article key={order.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-medium">{order.orderNumber} <span className="text-sm font-normal text-muted-foreground">(internal ID {order.id})</span></p><p className="mt-1 text-sm text-muted-foreground">{order.customerEmail} · {formatDate(order.createdAt)}</p><p className="mt-2 text-sm">{order.shippingName} · {order.shippingPhone}</p><p className="text-sm text-muted-foreground">{order.shippingAddress}</p></div><div className="text-right"><p className="text-lg font-medium">{formatInr(order.total)}</p><select className="select-control mt-2 h-9 rounded-md border border-input bg-background px-2 text-sm capitalize" value={order.status} onChange={(e) => void change(order.id, e.target.value as OrderStatus)}>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</select></div></div><ul className="mt-5 grid gap-2 border-t border-border pt-4 text-sm text-muted-foreground sm:grid-cols-2">{order.items.map((item) => <li key={item.id}>{item.productName} × {item.quantity} · {formatInr(item.unitPrice * item.quantity)}</li>)}</ul></article>)}{orders.length === 0 ? <p className="rounded-2xl border border-border p-6 text-sm text-muted-foreground">No orders yet.</p> : null}</div></AdminState></AdminPage></AdminLayout>;
}
