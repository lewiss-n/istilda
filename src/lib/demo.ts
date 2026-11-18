import "server-only";
import type { Queryable } from "./db";
import { slugify } from "./format";

/** Demo deployments (DEMO_MODE=true) show this to visitors and in the admin. */
export function isDemo() {
  return process.env.DEMO_MODE === "true";
}

type Sample = {
  name: string;
  category: string;
  price: number;
  was?: number;
  option?: [string, string];
  featured?: boolean;
  description: string;
  brand?: string;
  origin?: string;
  pack?: string;
  /** Best before, in months from now. */
  months?: number;
  allergens?: string;
};

const SAMPLES: Sample[] = [
  { name: "Body Wave Bundles (3 pcs)", category: "wigs", price: 12500, was: 15000, option: ["Length", "12in, 14in, 16in, 18in"], featured: true, description: "Sample product for the demo.\nSoft body wave bundles, sold as a set of three." },
  { name: "13x4 Lace Frontal Wig", category: "wigs", price: 18900, option: ["Length", "16in, 20in, 24in"], description: "Sample product for the demo.\nPre-plucked lace frontal wig." },
  { name: "Structured Top-Handle Handbag", category: "handbags", price: 6800, featured: true, description: "Sample product for the demo.\nTop-handle bag with a detachable strap." },
  { name: "Everyday Canvas Tote", category: "tote-bags", price: 1500, was: 1900, option: ["Colour", "Beige, Black"], description: "Sample product for the demo.\nRoomy canvas tote with an inner pocket." },
  { name: "Mini Smartphone Projector", category: "electronics", price: 7400, featured: true, description: "Sample product for the demo.\nPocket projector for movie nights." },
  { name: "Wireless Earbuds", category: "electronics", price: 3200, description: "Sample product for the demo.\nCompact earbuds with a charging case." },
  { name: "Portable Electric Kettle", category: "electric-gadgets", price: 2600, description: "Sample product for the demo.\nFoldable 0.6L kettle for home and travel." },
  { name: "Velvet Matte Lipstick", category: "cosmetics", price: 950, option: ["Shade", "Ruby, Nude, Berry"], description: "Sample product for the demo.\nLong-wear matte finish." },
  { name: "Oud Eau de Parfum 100ml", category: "perfumes", price: 4200, was: 5200, featured: true, description: "Sample product for the demo.\nWarm oud with vanilla and amber." },
  { name: "Wide Brim Fedora", category: "headwear", price: 2450, description: "Sample product for the demo.\nClassic fedora with a ribbon band." },
  { name: "Feather Fascinator", category: "headwear", price: 1800, description: "Sample product for the demo.\nFascinator on a slim headband." },
  { name: "Chunky Sole Sneakers", category: "shoes", price: 4800, option: ["Size", "37, 38, 39, 40, 41"], description: "Sample product for the demo.\nLightweight platform sneakers." },
  { name: "Leather Slide Sandals", category: "sandals", price: 2100, option: ["Size", "37, 38, 39, 40"], description: "Sample product for the demo.\nCushioned everyday slides." },
  { name: "Cable Knit Sweater", category: "tops", price: 2900, option: ["Size", "S, M, L, XL"], description: "Sample product for the demo.\nCosy cable knit." },
  { name: "Non-stick Ceramic Pot Set", category: "kitchen", price: 5600, was: 6900, description: "Sample product for the demo.\nThree-piece ceramic-coated pot set." },
];

/** Istilda Pantry samples. The brands are made up for the demo. */
const PANTRY_SAMPLES: Sample[] = [
  { name: "Ground Cinnamon", category: "spices", price: 450, brand: "Spice Route", origin: "Sri Lanka", pack: "100 g", months: 18, featured: true, description: "Sample product for the demo.\nWarm, sweet Ceylon cinnamon for baking, tea and chai." },
  { name: "Pilau Masala", category: "spices", price: 380, brand: "Spice Route", origin: "Kenya", pack: "100 g", months: 14, description: "Sample product for the demo.\nWhole-spice blend for pilau." },
  { name: "Roasted Almonds", category: "nuts", price: 1450, was: 1650, brand: "Orchard Gold", origin: "USA", pack: "500 g", months: 9, featured: true, allergens: "Contains almonds. Packed in a facility that also handles peanuts and other tree nuts.", description: "Sample product for the demo.\nLightly roasted, unsalted almonds." },
  { name: "Salted Cashews", category: "nuts", price: 1250, brand: "Orchard Gold", origin: "Vietnam", pack: "400 g", months: 8, allergens: "Contains cashews. May contain traces of peanuts.", description: "Sample product for the demo.\nWhole cashews, roasted with sea salt." },
  { name: "Medjool Dates", category: "dry-fruits", price: 1800, brand: "Desert Bloom", origin: "Saudi Arabia", pack: "1 kg", months: 10, featured: true, description: "Sample product for the demo.\nSoft, caramel-sweet Medjool dates." },
  { name: "Dried Apricots", category: "dry-fruits", price: 950, brand: "Desert Bloom", origin: "Turkey", pack: "500 g", months: 12, allergens: "Contains sulphites.", description: "Sample product for the demo.\nPlump, naturally sweet Turkish apricots." },
  { name: "Honey Almond Granola", category: "granola", price: 890, brand: "Morning Crunch", origin: "South Africa", pack: "750 g", months: 7, allergens: "Contains oats (gluten) and almonds. May contain traces of peanuts and sesame.", description: "Sample product for the demo.\nOven-baked oat clusters with honey and almonds." },
  { name: "Berry & Seed Granola", category: "granola", price: 950, brand: "Morning Crunch", origin: "South Africa", pack: "500 g", months: 7, allergens: "Contains oats (gluten). May contain traces of nuts.", description: "Sample product for the demo.\nCrunchy granola with dried berries and pumpkin seeds." },
];

async function insertSamples(c: Queryable, samples: Sample[], ids: Record<string, number>) {
  for (const [i, s] of samples.entries()) {
    const r = await c.query<{ id: number }>(
      `INSERT INTO products (name, slug, category, description, price, compare_price, option_label, option_values, featured,
                             brand, origin, pack_size, best_before, allergens, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
               CASE WHEN $13::int IS NULL THEN NULL ELSE (current_date + $13::int * interval '1 month')::date END,
               $14, now() - $15 * interval '1 hour', now())
       ON CONFLICT (slug) DO NOTHING RETURNING id`,
      [s.name, slugify(s.name), s.category, s.description, s.price, s.was ?? null, s.option?.[0] ?? "", s.option?.[1] ?? "", Boolean(s.featured),
        s.brand ?? "", s.origin ?? "", s.pack ?? "", s.months ?? null, s.allergens ?? "", i],
    );
    if (r.rows[0]) ids[s.name] = r.rows[0].id;
  }
}

/**
 * Fills an empty demo store with sample products and two sample orders, once.
 * Runs inside the migration transaction. Never runs unless DEMO_MODE=true, and never again
 * after the first time (even if you delete the samples).
 */
export async function seedDemoContent(c: Queryable) {
  const { rows } = await c.query<{ seeded: boolean; pantry: boolean; empty: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM settings WHERE key = 'demo_seeded') AS seeded,
            EXISTS (SELECT 1 FROM settings WHERE key = 'demo_pantry_seeded') AS pantry,
            NOT EXISTS (SELECT 1 FROM products) AND NOT EXISTS (SELECT 1 FROM orders) AS empty`,
  );
  const ids: Record<string, number> = {};

  // Demo stores set up before Istilda Pantry existed get the pantry samples once.
  if (rows[0].seeded) {
    if (!rows[0].pantry) {
      await insertSamples(c, PANTRY_SAMPLES, ids);
      await c.query("INSERT INTO settings (key, value) VALUES ('demo_pantry_seeded', '1') ON CONFLICT (key) DO NOTHING");
      console.log(`[demo] added ${PANTRY_SAMPLES.length} sample Istilda Pantry products`);
    }
    return;
  }
  if (!rows[0].empty) return;

  await insertSamples(c, [...SAMPLES, ...PANTRY_SAMPLES], ids);

  const orders = [
    {
      ref: "IST-DEMO01",
      channel: "website",
      status: "new",
      name: "Sample Customer",
      phone: "254700000001",
      location: "Kilimani, Nairobi",
      notes: "Sample order created for the demo.",
      items: [
        ["Body Wave Bundles (3 pcs)", "Length: 16in", 12500, 1],
        ["Velvet Matte Lipstick", "Shade: Ruby", 950, 2],
      ],
    },
    {
      ref: "IST-DEMO02",
      channel: "whatsapp",
      status: "confirmed",
      name: "Sample Customer 2",
      phone: "254700000002",
      location: "Westlands, Nairobi",
      notes: "Sample order created for the demo.",
      items: [["Oud Eau de Parfum 100ml", "", 4200, 1]],
    },
  ] as const;

  for (const o of orders) {
    const subtotal = o.items.reduce((s, i) => s + i[2] * i[3], 0);
    const count = o.items.reduce((s, i) => s + i[3], 0);
    const r = await c.query<{ id: number }>(
      `INSERT INTO orders (ref, channel, status, customer_name, phone, location, notes, subtotal, item_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (ref) DO NOTHING RETURNING id`,
      [o.ref, o.channel, o.status, o.name, o.phone, o.location, o.notes, subtotal, count],
    );
    if (!r.rows[0]) continue;
    for (const [name, option, price, qty] of o.items) {
      await c.query(
        "INSERT INTO order_items (order_id, product_id, product_name, option_value, unit_price, quantity) VALUES ($1, $2, $3, $4, $5, $6)",
        [r.rows[0].id, ids[name] ?? null, name, option, price, qty],
      );
    }
  }

  await c.query("INSERT INTO settings (key, value) VALUES ('demo_seeded', '1'), ('demo_pantry_seeded', '1') ON CONFLICT (key) DO NOTHING");
  console.log(`[demo] added ${SAMPLES.length + PANTRY_SAMPLES.length} sample products and ${orders.length} sample orders`);
}
