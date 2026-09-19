import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAdminDialog } from "@/components/admin/admin-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { createRazorpayOrder, deliverySchema, formatDeliveryAddress, INDIAN_STATES, verifyRazorpayPayment, type DeliveryDetails } from "@/lib/store/razorpay";
import { useCart } from "@/lib/store/cart";
import { formatInr } from "@/lib/store/format";

declare global {
  interface Window { Razorpay?: new (options: RazorpayOptions) => RazorpayInstance; }
}

type RazorpayOptions = {
  key: string; amount: number; currency: string; name: string; description: string; order_id: string; checkout_config_id?: string;
  prefill: { name: string; email: string; contact: string }; notes: { address: string };
  method: { card: boolean; netbanking: boolean; wallet: boolean; upi: boolean; paylater: boolean; emi: boolean; cardless_emi: boolean };
  theme: { color: string; backdrop_color: string }; modal: { confirm_close: boolean; ondismiss: () => void };
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
};
type RazorpayInstance = { open: () => void; on: (event: "payment.failed", handler: (response: { error?: { description?: string } }) => void) => void };
type CreatedQuote = Awaited<ReturnType<typeof createRazorpayOrder>>;
type DeliveryForm = Omit<DeliveryDetails, "state"> & { state: DeliveryDetails["state"] | "" };

const EMPTY_DELIVERY: DeliveryForm = { fullName: "", mobile: "", houseNumber: "", building: "", street: "", landmark: "", city: "", state: "", pinCode: "" };
let razorpayScript: Promise<void> | null = null;
function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScript) return razorpayScript;
  razorpayScript = new Promise((resolve, reject) => { const script = document.createElement("script"); script.src = "https://checkout.razorpay.com/v1/checkout.js"; script.async = true; script.onload = () => resolve(); script.onerror = () => reject(new Error("Could not load the secure payment form. Check your connection and try again.")); document.head.appendChild(script); });
  return razorpayScript;
}
export const Route = createFileRoute("/checkout")({ component: CheckoutPage });
function validateDelivery(form: DeliveryForm): DeliveryDetails { const parsed = deliverySchema.safeParse({ ...form, state: form.state || undefined }); if (!parsed.success) throw new Error(parsed.error.issues[0]?.message || "Please complete all delivery details correctly."); return parsed.data; }

function CheckoutPage() {
  const { alert } = useAdminDialog(); const { user, isPending } = useCurrentUserState(); const items = useCart((s) => s.items); const clear = useCart((s) => s.clear); const nav = useNavigate();
  const [delivery, setDelivery] = useState<DeliveryForm>(EMPTY_DELIVERY); const [quote, setQuote] = useState<CreatedQuote | null>(null); const [notice, setNotice] = useState<string | null>(null);
  const localLines = useMemo(() => items.map((item) => ({ productId: item.productId, name: item.name, listPrice: item.listPrice ?? item.unitPrice, unitPrice: item.unitPrice, discountPercent: item.discountPercent ?? 0, quantity: item.quantity, lineTotal: item.unitPrice * item.quantity })), [items]);
  const displayLines = quote?.lines ?? localLines; const subtotal = displayLines.reduce((sum, item) => sum + item.listPrice * item.quantity, 0); const discountTotal = displayLines.reduce((sum, item) => sum + Math.max(0, item.listPrice - item.unitPrice) * item.quantity, 0); const deliveryCharge = quote?.deliveryCharge ?? 0; const displayTotal = quote ? quote.amount / 100 : subtotal - discountTotal + deliveryCharge;
  useEffect(() => { setQuote(null); setNotice(null); }, [items]);
  const updateDelivery = (key: keyof DeliveryForm, value: string) => { setDelivery((current) => ({ ...current, [key]: value })); setNotice(null); };
  const updateMobile = (value: string) => {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length > 10) digits = digits.slice(2);
    updateDelivery("mobile", digits.slice(0, 10));
  };

  const verify = useMutation({
    mutationFn: ({ created, response, validated }: { created: CreatedQuote; response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }; validated: DeliveryDetails }) => verifyRazorpayPayment({ data: { razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature, quoteToken: created.quoteToken, customer: validated } }),
    onSuccess: async (result) => { clear(); await alert({ title: "Payment successful", description: `Your order ${result.orderNumber} was placed successfully.` }); void nav({ to: "/account" }); },
    onError: (error) => void alert({ title: "Payment verification failed", description: error instanceof Error ? error.message : "Payment could not be verified. Please contact support before trying again." }),
  });
  const pay = useMutation({
    mutationFn: async () => { const validated = validateDelivery(delivery); await loadRazorpay(); const created = await createRazorpayOrder({ data: { items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })), customer: validated } }); setQuote(created); return { created, validated }; },
    onSuccess: ({ created, validated }) => {
      if (!window.Razorpay) throw new Error("The secure payment form is unavailable. Please try again.");
      const supportsUpiAndWallets = created.amount <= 10_000_000;
      const checkout = new window.Razorpay({ key: created.keyId, amount: created.amount, currency: created.currency, name: "Sahil Watch Co. TIMEMACHINE", description: "Authentic timepiece purchase", order_id: created.orderId, prefill: { name: validated.fullName, email: user?.primaryEmail ?? "", contact: validated.mobile.replace(/[\s-]/g, "").replace(/^\+91/, "") }, notes: { address: formatDeliveryAddress(validated) }, ...(created.checkoutConfigId ? { checkout_config_id: created.checkoutConfigId } : {}), method: { card: true, netbanking: true, wallet: supportsUpiAndWallets, upi: supportsUpiAndWallets, paylater: false, emi: false, cardless_emi: false }, theme: { color: "#004488", backdrop_color: "#111111" }, modal: { confirm_close: true, ondismiss: () => setNotice("Payment was cancelled. Your bag is still saved.") }, handler: (response) => verify.mutate({ created, response, validated }) });
      checkout.on("payment.failed", (response) => setNotice(response.error?.description || "Payment failed. Your bag is still saved; please try another enabled payment method.")); checkout.open();
    },
    onError: (error) => void alert({ title: "Payment setup failed", description: error instanceof Error ? error.message : "Could not start payment." }),
  });

  if (isPending) return <div className="h-40" />;
  if (!user) return <RedirectToSignIn />;
  if (!items.length) return <main className="px-5 py-24 text-center"><p className="text-muted-foreground">Your bag is empty.</p><Link to="/watches" className="mt-4 inline-block text-sm underline-offset-4 hover:underline">Shop watches</Link></main>;
  const busy = pay.isPending || verify.isPending;
  return <main className="mx-auto grid max-w-5xl gap-12 px-5 py-12 md:grid-cols-[minmax(0,1fr)_minmax(300px,0.7fr)] md:py-16">
    <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); if (!busy) pay.mutate(); }} noValidate>
      <div><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Secure checkout</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Delivery details</h1><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Enter the details exactly as they should appear on the delivery label. Every required field is checked before payment.</p></div>
      <section className="space-y-4 rounded-xl border border-border bg-card p-5" aria-labelledby="contact-heading"><div><h2 id="contact-heading" className="text-lg font-medium">Contact details</h2><p className="mt-1 text-xs text-muted-foreground">We use these details for delivery updates.</p></div><div><Label htmlFor="fullName">Full name *</Label><Input id="fullName" value={delivery.fullName} onChange={(e) => updateDelivery("fullName", e.target.value)} placeholder="Your full name" autoComplete="name" required /></div><div><Label htmlFor="mobile">Mobile number *</Label><div className="mt-1 flex h-10 w-full overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring/30"><span className="grid w-14 shrink-0 place-items-center border-r border-input bg-muted/50 text-sm text-muted-foreground" aria-hidden="true">+91</span><input id="mobile" value={delivery.mobile} onChange={(e) => updateMobile(e.target.value)} placeholder="10-digit mobile number" inputMode="numeric" autoComplete="tel-national" maxLength={10} pattern="[0-9]{10}" className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground" required /></div><p className="mt-1 text-xs text-muted-foreground">Enter exactly 10 digits. Only numbers are allowed; +91 is already included.</p></div></section>
      <section className="space-y-4 rounded-xl border border-border bg-card p-5" aria-labelledby="address-heading"><div><h2 id="address-heading" className="text-lg font-medium">Delivery address</h2><p className="mt-1 text-xs text-muted-foreground">Delivery is generally available across the listed states and UTs; coverage can vary by PIN code.</p></div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="houseNumber">House / Flat / Shop number *</Label><Input id="houseNumber" value={delivery.houseNumber} onChange={(e) => updateDelivery("houseNumber", e.target.value)} placeholder="Flat 402 / Shop 12" autoComplete="address-line1" required /></div><div><Label htmlFor="building">Building / Apartment / Society *</Label><Input id="building" value={delivery.building} onChange={(e) => updateDelivery("building", e.target.value)} placeholder="Building or society name" autoComplete="address-line2" required /></div></div><div><Label htmlFor="street">Street / Locality / Area *</Label><Input id="street" value={delivery.street} onChange={(e) => updateDelivery("street", e.target.value)} placeholder="Street, locality, or area" required /></div><div><Label htmlFor="landmark">Landmark <span className="font-normal text-muted-foreground">(optional)</span></Label><Input id="landmark" value={delivery.landmark} onChange={(e) => updateDelivery("landmark", e.target.value)} placeholder="Nearby landmark" autoComplete="off" /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="city">City *</Label><Input id="city" value={delivery.city} onChange={(e) => updateDelivery("city", e.target.value)} placeholder="City" autoComplete="address-level2" required /></div><div><Label htmlFor="state">State / Union Territory *</Label><select id="state" value={delivery.state} onChange={(e) => updateDelivery("state", e.target.value)} className="select-control mt-1 flex h-10 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm" required><option value="">Select state / UT</option>{INDIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}</select></div></div><div className="max-w-[15rem]"><Label htmlFor="pinCode">PIN code *</Label><Input id="pinCode" value={delivery.pinCode} onChange={(e) => updateDelivery("pinCode", e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6-digit PIN code" inputMode="numeric" autoComplete="postal-code" maxLength={6} required /><p className="mt-1 text-xs text-muted-foreground">Enter a valid 6-digit Indian PIN code.</p></div></section>
      {notice ? <p className="rounded-lg bg-card p-3 text-sm text-muted-foreground ring-1 ring-foreground/8">{notice}</p> : null}<Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Verifying delivery details…" : `Review and pay ${formatInr(displayTotal)}`}</Button><p className="text-xs leading-relaxed text-muted-foreground">The final amount is calculated on the server from the prices currently set in the Admin Panel. Your payment details are entered in Razorpay’s secure checkout form and are never sent to this website.</p>
    </form>
    <aside className="h-fit rounded-xl border border-border bg-card p-5 md:sticky md:top-24" aria-labelledby="summary-heading"><p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Review before payment</p><h2 id="summary-heading" className="mt-2 text-2xl font-medium tracking-tight">Order summary</h2><ul className="mt-5 divide-y divide-border">{displayLines.map((item) => <li key={item.productId} className="flex gap-3 py-4 first:pt-0"><div className="min-w-0 flex-1"><p className="text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">Quantity: {item.quantity}</p><p className="mt-1 text-xs text-muted-foreground">{item.discountPercent > 0 ? `${item.discountPercent}% discount · ` : ""}Unit price {formatInr(item.unitPrice)}</p></div><p className="text-sm tabular-nums">{formatInr(item.lineTotal)}</p></li>)}</ul><dl className="space-y-3 border-t border-border pt-4 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Item subtotal</dt><dd className="tabular-nums">{formatInr(subtotal)}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Discounts</dt><dd className="tabular-nums text-emerald-700">{discountTotal > 0 ? `−${formatInr(discountTotal)}` : formatInr(0)}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Delivery charges</dt><dd className="tabular-nums">{deliveryCharge === 0 ? "Free" : formatInr(deliveryCharge)}</dd></div><div className="flex justify-between gap-4 border-t border-border pt-3 text-base font-medium"><dt>Final payable amount</dt><dd className="tabular-nums">{formatInr(displayTotal)}</dd></div></dl><p className="mt-4 text-xs leading-relaxed text-muted-foreground">{quote ? "Prices and stock are confirmed for this payment attempt." : "Prices shown are from the products currently in your bag and will be confirmed again from the Admin Panel before payment."}</p></aside>
  </main>;
}

export { validateDelivery };

// Delivery form validation is also enforced by the server-side Zod schema before a Razorpay order is created.
