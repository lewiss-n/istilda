import { NextResponse } from "next/server";
import { createOrder, type OrderChannel } from "@/lib/orders";
import { getProductsByIds, optionList } from "@/lib/products";
import { getPublicSettings } from "@/lib/settings";
import { clientIp, rateLimit } from "@/lib/auth";
import { ksh, normalizePhone, waLink } from "@/lib/format";
import { recordEvent } from "@/lib/analytics";
import { visitorContext } from "@/lib/visitor";

type Body = {
  channel?: string;
  name?: string;
  phone?: string;
  email?: string;
  location?: string;
  notes?: string;
  company?: string; // honeypot: real people never see or fill this
  items?: { productId?: number; quantity?: number; option?: string }[];
};

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ").slice(0, max) : "");

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 });
  }

  if (body.company) return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 400 });
  if (!await rateLimit("order:" + (await clientIp()), 8, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many order requests. Please wait a few minutes or message us on WhatsApp." }, { status: 429 });
  }

  const channel: OrderChannel = body.channel === "whatsapp" ? "whatsapp" : "website";
  const name = clean(body.name, 100);
  const phoneRaw = clean(body.phone, 30);
  const phone = normalizePhone(phoneRaw);
  const email = clean(body.email, 120);
  const location = clean(body.location, 200);
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 1000) : "";

  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Please enter your name.";
  if (phone.length < 9 || phone.length > 15) errors.phone = "Please enter a phone number we can reach you on.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "That email doesn't look right.";
  if (location.length < 2) errors.location = "Please tell us where to deliver.";

  const wanted = (Array.isArray(body.items) ? body.items : []).slice(0, 50).filter((i) => Number.isInteger(i.productId));
  if (!wanted.length) errors.items = "Your cart is empty.";
  if (Object.keys(errors).length) return NextResponse.json({ error: "Please check the highlighted fields.", errors }, { status: 400 });

  // Prices always come from the database, never from the browser.
  const products = new Map((await getProductsByIds(wanted.map((i) => i.productId!))).map((p) => [p.id, p]));
  const items = [];
  for (const w of wanted) {
    const p = products.get(w.productId!);
    if (!p) continue;
    const qty = Math.min(99, Math.max(1, Math.floor(Number(w.quantity) || 1)));
    const options = optionList(p);
    const option = options.includes(clean(w.option, 60)) ? clean(w.option, 60) : "";
    items.push({ product_id: p.id, product_name: p.name, option_value: option ? `${p.option_label || "Option"}: ${option}` : "", unit_price: p.price, quantity: qty });
  }
  if (!items.length) {
    return NextResponse.json({ error: "The items in your cart are no longer available.", errors: { items: "unavailable" } }, { status: 400 });
  }

  const order = await createOrder({ channel, customer_name: name, phone, email, location, notes, items });

  const ctx = await visitorContext();
  if (ctx) await recordEvent({ type: "order", path: "/checkout", ...ctx });

  let whatsappUrl: string | null = null;
  const settings = await getPublicSettings();
  if (channel === "whatsapp" && settings.whatsapp_number) {
    const lines = [
      `Hello Istilda Importers! I'd like to order (ref ${order.ref}):`,
      "",
      ...items.map((i) => `• ${i.quantity} × ${i.product_name}${i.option_value ? ` (${i.option_value})` : ""} — ${ksh(i.unit_price * i.quantity)}`),
      "",
      `Total: ${ksh(order.subtotal)}`,
      `Name: ${name}`,
      `Phone: ${phoneRaw}`,
      `Deliver to: ${location}`,
      ...(notes ? [`Notes: ${notes}`] : []),
    ];
    whatsappUrl = waLink(settings.whatsapp_number, lines.join("\n"));
  }

  return NextResponse.json({ ref: order.ref, whatsappUrl });
}
