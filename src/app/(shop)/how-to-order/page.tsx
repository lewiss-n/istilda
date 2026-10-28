import Link from "next/link";
import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/settings";
import { waLink } from "@/lib/format";
import { IconWhatsApp } from "@/components/Icons";

export const metadata: Metadata = { title: "How ordering works" };

export default async function HowToOrder() {
  const s = await getPublicSettings();
  const steps = [
    { t: "Add items to your cart", d: "Browse the shop and add what you like. Pick a size, colour or length where the item has options." },
    { t: "Send an order request", d: "At checkout, give us your name, phone number and delivery location. Submit it on the website, or tap “Send on WhatsApp” to send it from your phone. Either way you get an order reference." },
    { t: "We confirm with you", d: "We call or message you to confirm stock, the delivery cost and how you'd like to pay. Nothing is charged before this." },
    { t: "Delivery", d: s.delivery_text || "We arrange delivery once your order is confirmed." },
  ];
  return (
    <div className="container-x max-w-3xl pt-10">
      <p className="kicker text-g7">Help</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-g9 sm:text-5xl">How ordering works</h1>
      <ol className="mt-10 space-y-4">
        {steps.map((x, i) => (
          <li key={x.t} className="flex gap-5 rounded-[22px] bg-alt p-6">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-[14px] font-display text-2xl font-extrabold ${i % 2 ? "bg-lime text-g9" : "bg-g9 text-lime"}`}>{i + 1}</span>
            <div>
              <h2 className="font-display text-xl font-extrabold text-g9">{x.t}</h2>
              <p className="mt-1 leading-relaxed text-ink/80">{x.d}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/shop" className="btn-primary">Start shopping</Link>
        {s.whatsapp_number && (
          <a href={waLink(s.whatsapp_number, "Hello Istilda Importers! I have a question about ordering.")} target="_blank" rel="noopener noreferrer" className="btn-outline">
            <IconWhatsApp /> Ask on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}
