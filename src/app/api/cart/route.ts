import { NextResponse } from "next/server";
import { getProductsByIds } from "@/lib/products";

export const dynamic = "force-dynamic";

/** Current price and availability for the products in a shopper's cart. */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 50);
  const products = (await getProductsByIds(ids)).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    inStock: Boolean(p.in_stock),
    image: p.images[0] ?? null,
  }));
  return NextResponse.json({ products });
}
