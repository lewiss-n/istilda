"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { useCartSync } from "./useCartSync";
import { ksh } from "@/lib/format";
import { imageUrl } from "@/lib/img";
import { IconWhatsApp, IconArrow } from "../Icons";

type Errors = Partial<Record<"name" | "phone" | "email" | "location" | "items", string>>;

export function CheckoutForm({ whatsappEnabled, deliveryText }: { whatsappEnabled: boolean; deliveryText: string }) {
  const { items, ready, subtotal, clear } = useCart();
  const { notice, unavailable } = useCartSync();
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "website" | "whatsapp">("");
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");

  if (!ready) return <div className="mt-10 h-64 animate-pulse rounded-[22px] bg-alt" />;
  if (!items.length) {
    return (
      <div className="mt-8 rounded-[22px] bg-mint p-10 text-center">
        <p className="font-display text-2xl font-extrabold text-g9">Your cart is empty</p>
        <Link href="/shop" className="btn-primary mt-5">Browse products</Link>
      </div>
    );
  }
  const blocked = items.some((i) => unavailable.has(i.productId));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const channel = submitter?.value === "whatsapp" ? "whatsapp" : "website";
    const fd = new FormData(e.currentTarget);
    setBusy(channel);
    setErrors({});
    setFormError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          name: fd.get("name"),
          phone: fd.get("phone"),
          email: fd.get("email"),
          location: fd.get("location"),
          notes: fd.get("notes"),
          company: fd.get("company"),
          items: items.map((i) => ({ productId: i.productId, quantity: i.qty, option: i.option })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors ?? {});
        setFormError(data.error ?? "Something went wrong. Please try again.");
        setBusy("");
        return;
      }
      if (data.whatsappUrl) {
        try {
          sessionStorage.setItem(`ist-wa-${data.ref}`, data.whatsappUrl);
        } catch {}
      }
      clear();
      router.push(`/order/${data.ref}${channel === "whatsapp" ? "?via=whatsapp" : ""}`);
    } catch {
      setFormError("We couldn't reach the shop. Check your connection and try again.");
      setBusy("");
    }
  }

  const fieldCls = (k: keyof Errors) => `field ${errors[k] ? "border-danger focus:border-danger focus:ring-red-100" : ""}`;

  return (
    <form
      onSubmit={submit}
      onInput={(e) => {
        const n = (e.target as HTMLInputElement).name as keyof Errors;
        if (errors[n]) setErrors((x) => ({ ...x, [n]: undefined }));
      }}
      noValidate
      className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]"
    >
      <div className="space-y-5 rounded-[22px] border-[1.5px] border-line p-5 sm:p-8">
        {notice && <p className="rounded-[12px] bg-mint px-4 py-3 text-sm font-medium text-g9" role="status">{notice}</p>}
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="label">Your name</label>
            <input id="name" name="name" autoComplete="name" required className={fieldCls("name")} aria-invalid={!!errors.name} aria-describedby={errors.name ? "name-err" : undefined} />
            {errors.name && <p id="name-err" className="mt-1 text-sm text-danger">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="label">Phone number</label>
            <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="07XX XXX XXX" required className={fieldCls("phone")} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "phone-err" : "phone-hint"} />
            {errors.phone ? <p id="phone-err" className="mt-1 text-sm text-danger">{errors.phone}</p> : <p id="phone-hint" className="mt-1 text-[13px] text-muted">We&apos;ll call or WhatsApp you on this number.</p>}
          </div>
        </div>
        <div>
          <label htmlFor="email" className="label">Email <span className="font-normal text-muted">(optional)</span></label>
          <input id="email" name="email" type="email" autoComplete="email" className={fieldCls("email")} aria-invalid={!!errors.email} />
          {errors.email && <p className="mt-1 text-sm text-danger">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="location" className="label">Delivery location</label>
          <input id="location" name="location" autoComplete="street-address" placeholder="Area, estate or town" required className={fieldCls("location")} aria-invalid={!!errors.location} />
          {errors.location ? <p className="mt-1 text-sm text-danger">{errors.location}</p> : deliveryText && <p className="mt-1 text-[13px] text-muted">{deliveryText}</p>}
        </div>
        <div>
          <label htmlFor="notes" className="label">Anything else? <span className="font-normal text-muted">(optional)</span></label>
          <textarea id="notes" name="notes" rows={3} className="field" placeholder="Preferred colour, delivery time, questions…" />
        </div>
        {/* Spam trap: hidden from people, bots tend to fill it in. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="company">Company</label>
          <input id="company" name="company" tabIndex={-1} autoComplete="off" />
        </div>

        {formError && <p className="rounded-[10px] bg-red-50 px-4 py-3 text-sm font-semibold text-danger" role="alert">{formError}</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          <button type="submit" value="website" disabled={!!busy || blocked} className="btn-primary h-[54px] text-base">
            {busy === "website" ? "Sending…" : <>Submit order request <IconArrow /></>}
          </button>
          {whatsappEnabled && (
            <button type="submit" value="whatsapp" disabled={!!busy || blocked} className="btn-lime h-[54px] text-base">
              {busy === "whatsapp" ? "Opening WhatsApp…" : <><IconWhatsApp /> Send on WhatsApp</>}
            </button>
          )}
        </div>
        <p className="text-[13px] text-muted">
          Either way, your request is saved with us and you get an order reference.
          {whatsappEnabled && " WhatsApp opens with your order typed out, ready to send."}
        </p>
      </div>

      <aside className="h-fit rounded-[22px] bg-alt p-5 sm:p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-xl font-extrabold text-g9">Your order</h2>
        <ul className="mt-4 space-y-3">
          {items.map((i) => (
            <li key={i.key} className="flex items-center gap-3">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-white">
                {i.image && <img src={imageUrl(i.image, "sm")} alt="" className="h-full w-full object-cover" />}
                <span className="absolute -top-0 -right-0 grid h-5 min-w-5 place-items-center rounded-bl-[8px] bg-g9 px-1 text-[11px] font-bold text-lime">{i.qty}</span>
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="block truncate font-semibold">{i.name}</span>
                {i.option && <span className="text-muted">{i.optionLabel || "Option"}: {i.option}</span>}
                {unavailable.has(i.productId) && <span className="block font-semibold text-danger">Sold out</span>}
              </span>
              <span className="text-sm font-semibold">{ksh(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-semibold">Subtotal</span>
          <span className="font-display text-2xl font-extrabold text-g9">{ksh(subtotal)}</span>
        </div>
        <p className="mt-1 text-[13px] text-muted">Delivery cost is confirmed with you.</p>
        <Link href="/cart" className="mt-3 inline-block text-sm font-semibold text-g7 hover:underline">Edit cart</Link>
      </aside>
    </form>
  );
}
