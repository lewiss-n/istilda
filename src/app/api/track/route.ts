import { NextResponse } from "next/server";
import { recordEvent, type EventType } from "@/lib/analytics";
import { visitorContext } from "@/lib/visitor";
import { getProductBySlug } from "@/lib/products";
import { memoryRateLimit, clientIp } from "@/lib/auth";

const CLIENT_TYPES: EventType[] = ["pageview", "product_view", "add_to_cart", "whatsapp_click"];

export async function POST(req: Request) {
  let body: { type?: string; path?: string; referrer?: string; productId?: number } = {};
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const type = body.type as EventType;
  if (!CLIENT_TYPES.includes(type)) return new NextResponse(null, { status: 204 });
  if (!memoryRateLimit("track:" + (await clientIp()), 120, 60_000)) return new NextResponse(null, { status: 204 });

  const ctx = await visitorContext();
  if (!ctx) return new NextResponse(null, { status: 204 });

  const path = typeof body.path === "string" && body.path.startsWith("/") ? body.path.split("?")[0] : "";
  if (path.startsWith("/admin")) return new NextResponse(null, { status: 204 });

  let referrer = "";
  if (typeof body.referrer === "string" && body.referrer) {
    try {
      const host = new URL(body.referrer).hostname.replace(/^www\./, "");
      const own = new URL(req.url).hostname.replace(/^www\./, "");
      if (host && host !== own) referrer = host;
    } catch {}
  }

  let productId = Number.isInteger(body.productId) ? body.productId! : null;
  if (type === "pageview" && path.startsWith("/product/")) {
    const p = await getProductBySlug(decodeURIComponent(path.slice("/product/".length)));
    if (p) await recordEvent({ type: "product_view", path, product_id: p.id, ...ctx });
    productId = p?.id ?? null;
  }

  await recordEvent({ type, path, product_id: productId, referrer, ...ctx });
  return new NextResponse(null, { status: 204 });
}
