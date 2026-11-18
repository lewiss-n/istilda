import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/lib/categories";
import { listProducts } from "@/lib/products";
import { isDemo } from "@/lib/demo";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

/** /sitemap.xml for search engines. Needs SITE_URL; empty on demo deployments. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  if (!base || isDemo()) return [];
  const url = (path: string) => new URL(path, base).toString();
  const products = await listProducts();
  return [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/shop"), changeFrequency: "daily", priority: 0.9 },
    ...CATEGORIES.map((c) => ({ url: url(`/shop?category=${c.slug}`), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.map((p) => ({ url: url(`/product/${p.slug}`), lastModified: new Date(p.updated_at), changeFrequency: "weekly" as const, priority: 0.8 })),
    { url: url("/how-to-order"), changeFrequency: "monthly", priority: 0.4 },
  ];
}
