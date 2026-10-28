import type { Metadata } from "next";
import { getPublicSettings } from "@/lib/settings";
import { CheckoutForm } from "@/components/cart/CheckoutForm";

export const metadata: Metadata = { title: "Send your order request" };

export default async function CheckoutPage() {
  const settings = await getPublicSettings();
  return (
    <div className="container-x pt-8">
      <p className="kicker text-g7">Almost done</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-g9 sm:text-5xl">Send your order request</h1>
      <p className="mt-3 max-w-2xl text-muted">
        No payment now. Tell us where to reach you and we&apos;ll confirm stock, delivery and payment before anything is sent.
      </p>
      <CheckoutForm whatsappEnabled={Boolean(settings.whatsapp_number)} deliveryText={settings.delivery_text} />
    </div>
  );
}
