export type Category = {
  slug: string;
  name: string;
  short: string;
  blurb: string;
  /** Tile color scheme used across the shop. */
  tone: "green" | "lime" | "mint" | "leaf";
};

export const CATEGORIES: Category[] = [
  { slug: "wigs", name: "Wigs, Bundles & Frontals", short: "Hair", blurb: "Wigs, bundles and frontal laces", tone: "green" },
  { slug: "handbags", name: "Handbags", short: "Handbags", blurb: "Everyday and evening bags", tone: "lime" },
  { slug: "tote-bags", name: "Tote Bags", short: "Totes", blurb: "Roomy totes for work and weekends", tone: "mint" },
  { slug: "electronics", name: "Electronic Gadgets", short: "Gadgets", blurb: "Smart little tech for every day", tone: "leaf" },
  { slug: "cosmetics", name: "Cosmetics", short: "Cosmetics", blurb: "Makeup and skincare", tone: "mint" },
  { slug: "perfumes", name: "Perfumes", short: "Perfumes", blurb: "Signature scents", tone: "green" },
  { slug: "headwear", name: "Hats, Headgear & Fascinators", short: "Headwear", blurb: "Hats, headgear and fascinators", tone: "lime" },
  { slug: "shoes", name: "Shoes", short: "Shoes", blurb: "Heels, flats and sneakers", tone: "leaf" },
  { slug: "sandals", name: "Sandals", short: "Sandals", blurb: "Slides and strappy sandals", tone: "lime" },
  { slug: "tops", name: "Sweaters & Tops", short: "Tops", blurb: "Knits, blouses and tops", tone: "green" },
  { slug: "kitchen", name: "Kitchen Gadgets", short: "Kitchen", blurb: "Clever tools for your kitchen", tone: "mint" },
];

export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function categoryName(slug: string) {
  return CATEGORY_MAP.get(slug)?.name ?? slug;
}

export const TONE_CLASSES: Record<Category["tone"], { bg: string; fg: string; sub: string; ring: string }> = {
  green: { bg: "bg-g9", fg: "text-lime", sub: "text-mint", ring: "border-lime" },
  lime: { bg: "bg-lime", fg: "text-g9", sub: "text-g9/80", ring: "border-g9" },
  mint: { bg: "bg-mint", fg: "text-g9", sub: "text-g7", ring: "border-g9" },
  leaf: { bg: "bg-g7", fg: "text-white", sub: "text-mint", ring: "border-lime" },
};
