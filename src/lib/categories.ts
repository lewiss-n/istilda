export type DepartmentSlug = "style" | "beauty" | "home-gadgets" | "pantry";

export type Category = {
  slug: string;
  name: string;
  short: string;
  blurb: string;
  department: DepartmentSlug;
  /** Tile color scheme used across the shop. */
  tone: "green" | "lime" | "mint" | "leaf" | "spice" | "saffron" | "cream";
};

export type Department = {
  slug: DepartmentSlug;
  name: string;
  /** Short line under the department name. */
  tagline: string;
  /** Longer intro on the department page. */
  intro: string;
  /** Pantry has its own warmer look; the others use the house greens. */
  theme: "house" | "pantry";
};

export const DEPARTMENTS: Department[] = [
  {
    slug: "style",
    name: "Style",
    tagline: "Hair, bags, hats, shoes and knits",
    intro: "Wigs and bundles, handbags and totes, elegant hats, shoes, sandals and sweaters, picked for how they look and how long they last.",
    theme: "house",
  },
  {
    slug: "beauty",
    name: "Beauty",
    tagline: "Makeup, skincare and fragrance",
    intro: "Cosmetics and perfumes we'd happily wear ourselves, from everyday staples to signature scents.",
    theme: "house",
  },
  {
    slug: "home-gadgets",
    name: "Home & Gadgets",
    tagline: "Kitchen tools, appliances and tech",
    intro: "Clever kitchen tools, handy electric appliances and smart little gadgets that make every day easier.",
    theme: "house",
  },
  {
    slug: "pantry",
    name: "Istilda Pantry",
    tagline: "Spices, nuts, dry fruits and granola",
    intro: "Spices, nuts, dry fruits and granola from brands we trust, chosen the same way as everything else we import: carefully.",
    theme: "pantry",
  },
];

export const DEPARTMENT_MAP = new Map(DEPARTMENTS.map((d) => [d.slug, d]));

export const CATEGORIES: Category[] = [
  // Style
  { slug: "wigs", name: "Wigs, Bundles & Frontals", short: "Hair", blurb: "Wigs, bundles and frontal laces", department: "style", tone: "green" },
  { slug: "handbags", name: "Handbags", short: "Handbags", blurb: "Everyday and evening bags", department: "style", tone: "lime" },
  { slug: "tote-bags", name: "Tote Bags", short: "Tote bags", blurb: "Roomy tote bags for work and weekends", department: "style", tone: "mint" },
  { slug: "headwear", name: "Elegant Hats & Fascinators", short: "Elegant hats", blurb: "Elegant hats and fascinators", department: "style", tone: "lime" },
  { slug: "shoes", name: "Shoes", short: "Shoes", blurb: "Heels, flats and sneakers", department: "style", tone: "leaf" },
  { slug: "sandals", name: "Sandals", short: "Sandals", blurb: "Slides and strappy sandals", department: "style", tone: "lime" },
  { slug: "tops", name: "Sweaters & Tops", short: "Tops", blurb: "Knits, blouses and tops", department: "style", tone: "green" },
  // Beauty
  { slug: "cosmetics", name: "Cosmetics", short: "Cosmetics", blurb: "Makeup and skincare", department: "beauty", tone: "mint" },
  { slug: "perfumes", name: "Perfumes", short: "Perfumes", blurb: "Signature scents", department: "beauty", tone: "green" },
  // Home & Gadgets
  { slug: "kitchen", name: "Kitchen Gadgets", short: "Kitchen", blurb: "Clever tools for your kitchen", department: "home-gadgets", tone: "mint" },
  { slug: "electric-gadgets", name: "Electric Gadgets", short: "Electric gadgets", blurb: "Handy electric appliances for home and travel", department: "home-gadgets", tone: "green" },
  { slug: "electronics", name: "Electronic Gadgets", short: "Gadgets", blurb: "Smart little tech for every day", department: "home-gadgets", tone: "leaf" },
  // Istilda Pantry
  { slug: "spices", name: "Spices", short: "Spices", blurb: "Whole and ground spices, blends and seasonings", department: "pantry", tone: "spice" },
  { slug: "nuts", name: "Nuts", short: "Nuts", blurb: "Almonds, cashews, pistachios and more", department: "pantry", tone: "saffron" },
  { slug: "dry-fruits", name: "Dry Fruits", short: "Dry fruits", blurb: "Dates, apricots, raisins, figs and more", department: "pantry", tone: "cream" },
  { slug: "granola", name: "Granola", short: "Granola", blurb: "Granola and crunchy breakfast mixes", department: "pantry", tone: "spice" },
];

export function categoriesIn(department: DepartmentSlug) {
  return CATEGORIES.filter((c) => c.department === department);
}

export function departmentOf(categorySlug: string): Department | undefined {
  const c = CATEGORY_MAP.get(categorySlug);
  return c ? DEPARTMENT_MAP.get(c.department) : undefined;
}

export function isPantry(categorySlug: string) {
  return CATEGORY_MAP.get(categorySlug)?.department === "pantry";
}

export const CATEGORY_MAP = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function categoryName(slug: string) {
  return CATEGORY_MAP.get(slug)?.name ?? slug;
}

export const TONE_CLASSES: Record<Category["tone"], { bg: string; fg: string; sub: string; ring: string }> = {
  green: { bg: "bg-g9", fg: "text-lime", sub: "text-mint", ring: "border-lime" },
  lime: { bg: "bg-lime", fg: "text-g9", sub: "text-g9/80", ring: "border-g9" },
  mint: { bg: "bg-mint", fg: "text-g9", sub: "text-g7", ring: "border-g9" },
  leaf: { bg: "bg-g7", fg: "text-white", sub: "text-mint", ring: "border-lime" },
  // Istilda Pantry
  spice: { bg: "bg-spice", fg: "text-cream", sub: "text-cream/80", ring: "border-saffron" },
  saffron: { bg: "bg-saffron", fg: "text-cocoa", sub: "text-cocoa/75", ring: "border-cocoa" },
  cream: { bg: "bg-cream", fg: "text-cocoa", sub: "text-cocoa/70", ring: "border-cocoa" },
};
