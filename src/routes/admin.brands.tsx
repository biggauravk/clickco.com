import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAdminDialog } from "@/components/admin/admin-dialog";
import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminPage, AdminState, BrandForm, type BrandFormValue } from "@/components/admin/admin-utils";
import { Button } from "@/components/ui/button";
import { adminCreateBrand, adminDeleteBrand, adminListBrands, adminUpdateBrand } from "@/lib/store/admin";
import type { Brand } from "@/lib/store/types";

export const Route = createFileRoute("/admin/brands")({ component: AdminBrandsPage });

function AdminBrandsPage() {
  const { alert, confirm } = useAdminDialog();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  async function load() { setLoading(true); try { setBrands(await adminListBrands()); setError(null); } catch (e) { setError(e); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  async function save(value: BrandFormValue) { if (!value.name.trim() || !value.description.trim() || !value.imageUrl.trim()) { await alert({ title: "Required Information", description: "Please complete the brand name, description, and image before continuing." }); return; } try { if (editing) await adminUpdateBrand({ data: { ...value, id: editing.id } }); else await adminCreateBrand({ data: value }); await alert({ title: editing ? "Brand updated" : "Brand added", description: editing ? "The brand details were updated successfully." : "The brand was added successfully." }); setEditing(null); setCreating(false); await load(); } catch (e) { await alert({ title: editing ? "Brand update failed" : "Brand creation failed", description: e instanceof Error ? e.message : "Something went wrong. Please try again." }); } }
  async function remove(brand: Brand) { if (!await confirm({ title: "Delete brand?", description: `You are about to permanently delete ${brand.name}. This action cannot be undone.`, confirmLabel: "Delete brand", cancelLabel: "Keep brand", destructive: true })) return; try { await adminDeleteBrand({ data: { id: brand.id } }); await alert({ title: "Brand deleted", description: "The brand was deleted successfully." }); await load(); } catch (e) { await alert({ title: "Brand deletion failed", description: e instanceof Error ? e.message : "Something went wrong. Please try again." }); } }
  if (creating || editing) return <AdminLayout><AdminPage title={editing ? "Edit brand" : "New brand"}><div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-4 sm:p-6"><BrandForm initial={editing ?? undefined} onSubmit={save} onCancel={() => { setCreating(false); setEditing(null); }} /></div></AdminPage></AdminLayout>;
  return <AdminLayout><AdminPage title="Brands"><div className="flex justify-end"><Button onClick={() => setCreating(true)}>Add brand</Button></div><AdminState loading={loading} error={error}><div className="grid gap-4 md:grid-cols-2">{brands.map((brand) => <article key={brand.id} className="rounded-2xl border border-border bg-card p-5"><div className="flex gap-4"><img src={brand.imageUrl} alt={`${brand.name} logo`} className="size-16 rounded-xl bg-muted object-contain object-center" /><div className="min-w-0"><h2 className="font-medium">{brand.name}</h2><p className="mt-1 text-sm text-muted-foreground">{brand.productCount} products · /{brand.slug}</p></div></div><p className="mt-4 text-sm text-muted-foreground">{brand.description}</p><div className="mt-5 flex gap-2"><Button size="sm" variant="secondary" onClick={() => setEditing(brand)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => void remove(brand)}>Delete</Button></div></article>)}{brands.length === 0 ? <p className="rounded-2xl border border-border p-6 text-sm text-muted-foreground">No brands yet.</p> : null}</div></AdminState></AdminPage></AdminLayout>;
}
