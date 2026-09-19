import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaPicker } from "@/components/admin/media-picker";
import { formatDate, formatInr } from "@/lib/store/format";

export function AdminPage({ title, kicker, children }: { title: string; kicker?: string; children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[1280px] space-y-8"><header className="min-w-0"><p className="truncate text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{kicker ?? "Admin"}</p><h1 className="mt-2 break-words text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1></header>{children}</div>;
}

export function AdminState({ loading, error, children }: { loading?: boolean; error?: unknown; children: ReactNode }) {
  if (loading) return <p className="rounded-xl border border-border p-6 text-sm text-muted-foreground">Loading this section…</p>;
  if (error) return <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">{error instanceof Error ? error.message : "We could not load this section. Please try again."}</p>;
  return <>{children}</>;
}

export function AdminFormField({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}{hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}</div>;
}

export function ProductForm({ initial, brands, busy, onSubmit, onCancel }: { initial?: Partial<ProductFormValue>; brands: Array<{ id: number; name: string }>; busy?: boolean; onSubmit: (value: ProductFormValue) => void; onCancel?: () => void }) {
  const [value, setValue] = useState<ProductFormValue>({
    name: initial?.name ?? "", brandId: initial?.brandId ?? brands[0]?.id ?? 0, collection: initial?.collection ?? "men",
    shortDescription: initial?.shortDescription ?? "", fullDescription: initial?.fullDescription ?? "", price: initial?.price ?? 0,
    discountPercent: initial?.discountPercent ?? 0, stock: initial?.stock ?? 1, images: initial?.images ?? [""], videoUrl: initial?.videoUrl ?? "",
    videoPosterUrl: initial?.videoPosterUrl ?? "", featured: initial?.featured ?? false,
  });
  const update = <K extends keyof ProductFormValue>(key: K, next: ProductFormValue[K]) => setValue((current) => ({ ...current, [key]: next }));
  return <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); onSubmit(value); }} noValidate>
    <div className="grid gap-5 md:grid-cols-2"><AdminFormField label="Name"><Input value={value.name} onChange={(e) => update("name", e.target.value)} /></AdminFormField><AdminFormField label="Brand"><select className="select-control h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value.brandId} onChange={(e) => update("brandId", Number(e.target.value))}>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></AdminFormField></div>
    <div className="grid gap-5 md:grid-cols-3"><AdminFormField label="Collection"><select className="select-control h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value.collection} onChange={(e) => update("collection", e.target.value as "men" | "women")}><option value="men">Men</option><option value="women">Women</option></select></AdminFormField><AdminFormField label="Price (₹)"><Input type="number" min="1" value={value.price} onChange={(e) => update("price", Number(e.target.value))} /></AdminFormField><AdminFormField label="Stock"><Input type="number" min="1" value={value.stock} onChange={(e) => update("stock", Number(e.target.value))} /></AdminFormField></div>
    <div className="grid gap-5 md:grid-cols-2"><AdminFormField label="Discount (%)"><Input type="number" min="0" max="80" value={value.discountPercent} onChange={(e) => update("discountPercent", Number(e.target.value))} /></AdminFormField><AdminFormField label="Featured"><label className="flex h-10 items-center gap-2 text-sm"><input type="checkbox" checked={value.featured} onChange={(e) => update("featured", e.target.checked)} /> Show in featured sections</label></AdminFormField></div>
    <AdminFormField label="Short description"><Input value={value.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} /></AdminFormField>
    <AdminFormField label="Full description"><Textarea className="h-36 max-h-36 overflow-y-auto" value={value.fullDescription} onChange={(e) => update("fullDescription", e.target.value)} rows={5} /></AdminFormField>
    <MediaPicker value={value.images.filter(Boolean)} onChange={(images) => update("images", images)} purpose="product" mediaType="image" max={5} ratio={3 / 4} label="Add product images" />
    <div className="grid gap-5 md:grid-cols-2"><MediaPicker value={value.videoUrl ? [value.videoUrl] : []} onChange={(media) => update("videoUrl", media[0] ?? "")} purpose="video" mediaType="video" max={1} ratio={16 / 9} label="Upload product film" /><MediaPicker value={value.videoPosterUrl ? [value.videoPosterUrl] : []} onChange={(media) => update("videoPosterUrl", media[0] ?? "")} purpose="poster" mediaType="image" max={1} ratio={9 / 16} label="Add video poster" /></div>
    <div className="flex gap-3"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save product"}</Button>{onCancel ? <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button> : null}</div>
  </form>;
}
export type ProductFormValue = { name: string; brandId: number; collection: "men" | "women"; shortDescription: string; fullDescription: string; price: number; discountPercent: number; stock: number; images: string[]; videoUrl: string; videoPosterUrl: string; featured: boolean };

export function BrandForm({ initial, busy, onSubmit, onCancel }: { initial?: Partial<BrandFormValue>; busy?: boolean; onSubmit: (value: BrandFormValue) => void; onCancel?: () => void }) {
  const [value, setValue] = useState<BrandFormValue>({ name: initial?.name ?? "", description: initial?.description ?? "", imageUrl: initial?.imageUrl ?? "" });
  return <form className="grid gap-5" onSubmit={(event) => { event.preventDefault(); onSubmit(value); }} noValidate><AdminFormField label="Name"><Input value={value.name} onChange={(e) => setValue({ ...value, name: e.target.value })} /></AdminFormField><AdminFormField label="Description"><Textarea className="h-24 max-h-24 overflow-y-auto" value={value.description} onChange={(e) => setValue({ ...value, description: e.target.value })} rows={3} /></AdminFormField><MediaPicker value={value.imageUrl ? [value.imageUrl] : []} onChange={(media) => setValue({ ...value, imageUrl: media[0] ?? "" })} purpose="brand" mediaType="image" max={1} ratio={1} label="Add brand image" /><div className="flex gap-3"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save brand"}</Button>{onCancel ? <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button> : null}</div></form>;
}
export type BrandFormValue = { name: string; description: string; imageUrl: string };
export { formatDate, formatInr };
export function useAsyncAction() { const [busy, setBusy] = useState(false); return { busy, setBusy }; }
