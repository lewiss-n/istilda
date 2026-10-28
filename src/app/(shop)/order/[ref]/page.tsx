import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getOrderByRef, getOrderItems } from "@/lib/orders";
import { ksh } from "@/lib/format";
import { IconCheck } from "@/components/Icons";
import { OpenWhatsApp } from "@/components/cart/OpenWhatsApp";

export const metadata: Metadata = { title: "Order request received", robots: { index: false } };

export default async function OrderThanks({ params, searchParams }: { params: Promise<{ ref: string }>; searchParams: Promise<{ via?: string }> }) {
  const { ref } = await params;
  const { via } = await searchParams;
  const order = await getOrderByRef(ref);
  if (!order) notFound();
  const items = await getOrderItems(order.id);
  const viaWa = via === "whatsapp";

  return (
    <div className="container-x pt-8">
      <div className="relative overflow-hidden rounded-[32px] bg-g9 px-6 py-12 text-center text-white sm:px-12">
        <div className="pointer-events-none absolute -top-8 -left-8 flex gap-3 opacity-60" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-16 w-16 rounded-full border-[9px] border-g7" />
          ))}
        </div>
        <span className="mx-auto grid h-16 w-16 animate-rise place-items-center rounded-full bg-lime text-g9">
          <IconCheck className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
          {viaWa ? "Almost there!" : "Order request received!"}
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-mint">
          {viaWa
            ? "Your request is saved. Send the WhatsApp message that just opened so we can confirm your order quickly."
            : "Thank you! We'll call or WhatsApp you shortly to confirm stock, delivery and payment."}
        </p>
        <p className="mt-6 inline-flex items-center gap-3 rounded-full bg-g7 px-5 py-2.5">
          <span className="text-sm text-mint">Your reference</span>
          <span className="font-display text-xl font-extrabold tracking-wider text-lime">{order.ref}</span>
        </p>
        {viaWa && <OpenWhatsApp orderRef={order.ref} />}
      </div>

      <div className="mx-auto mt-8 max-w-2xl rounded-[22px] border-[1.5px] border-line p-6">
        <h2 className="font-display text-xl font-extrabold text-g9">What you asked for</h2>
        <ul className="mt-4 divide-y divide-line">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-3">
              <span>
                <span className="font-semibold">{i.quantity} × {i.product_name}</span>
                {i.option_value && <span className="block text-sm text-muted">{i.option_value}</span>}
              </span>
              <span className="font-semibold">{ksh(i.unit_price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-semibold">Subtotal</span>
          <span className="font-display text-2xl font-extrabold text-g9">{ksh(order.subtotal)}</span>
        </div>
        <p className="mt-2 text-sm text-muted">Delivery cost will be confirmed with you. Keep your reference handy if you contact us.</p>
        <div className="mt-6 text-center">
          <Link href="/shop" className="btn-outline">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
