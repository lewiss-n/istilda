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
};

const SAMPLES: Sample[] = [
  { name: "Body Wave Bundles (3 pcs)", category: "wigs", price: 12500, was: 15000, option: ["Length", "12in, 14in, 16in, 18in"], featured: true, description: "Sample product for the demo.\nSoft body wave bundles, sold as a set of three." },
  { name: "13x4 Lace Frontal Wig", category: "wigs", price: 18900, option: ["Length", "16in, 20in, 24in"], description: "Sample product for the demo.\nPre-plucked lace frontal wig." },
  { name: "Structured Top-Handle Handbag", category: "handbags", price: 6800, featured: true, description: "Sample product for the demo.\nTop-handle bag with a detachable strap." },
  { name: "Everyday Canvas Tote", category: "tote-bags", price: 1500, was: 1900, option: ["Colour", "Beige, Black"], description: "Sample product for the demo.\nRoomy canvas tote with an inner pocket." },
  { name: "Mini Smartphone Projector", category: "electronics", price: 7400, featured: true, description: "Sample product for the demo.\nPocket projector for movie nights." },
  { name: "Wireless Earbuds", category: "electronics", price: 3200, description: "Sample product for the demo.\nCompact earbuds with a charging case." },
  { name: "Velvet Matte Lipstick", category: "cosmetics", price: 950, option: ["Shade", "Ruby, Nude, Berry"], description: "Sample product for the demo.\nLong-wear matte finish." },
  { name: "Oud Eau de Parfum 100ml", category: "perfumes", price: 4200, was: 5200, featured: true, description: "Sample product for the demo.\nWarm oud with vanilla and amber." },
  { name: "Wide Brim Fedora", category: "headwear", price: 2450, description: "Sample product for the demo.\nClassic fedora with a ribbon band." },
  { name: "Feather Fascinator", category: "headwear", price: 1800, description: "Sample product for the demo.\nFascinator on a slim headband." },
  { name: "Chunky Sole Sneakers", category: "shoes", price: 4800, option: ["Size", "37, 38, 39, 40, 41"], description: "Sample product for the demo.\nLightweight platform sneakers." },
  { name: "Leather Slide Sandals", category: "sandals", price: 2100, option: ["Size", "37, 38, 39, 40"], description: "Sample product for the demo.\nCushioned everyday slides." },
  { name: "Cable Knit Sweater", category: "tops", price: 2900, option: ["Size", "S, M, L, XL"], description: "Sample product for the demo.\nCosy cable knit." },
  { name: "Non-stick Ceramic Pot Set", category: "kitchen", price: 5600, was: 6900, description: "Sample product for the demo.\nThree-piece ceramic-coated pot set." },
];

/**
 * Fills an empty demo store with sample products and two sample orders, once.
 * Runs inside the migration transaction. Never runs unless DEMO_MODE=true, and never again
 * after the first time (even if you delete the samples).
 */
export async function seedDemoContent(c: Queryable) {
  const { rows } = await c.query<{ seeded: boolean; empty: boolean }>(
    `SELECT EXISTS (SELECT 1 FROM settings WHERE key = 'demo_seeded') AS seeded,
            NOT EXISTS (SELECT 1 FROM products) AND NOT EXISTS (SELECT 1 FROM orders) AS empty`,
  );
  if (rows[0].seeded || !rows[0].empty) return;

  const ids: Record<string, number> = {};
  for (const [i, s] of SAMPLES.entries()) {
    const r = await c.query<{ id: number }>(
      `INSERT INTO products (name, slug, category, description, price, compare_price, option_label, option_values, featured, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now() - $10 * interval '1 hour', now()) RETURNING id`,
      [s.name, slugify(s.name), s.category, s.description, s.price, s.was ?? null, s.option?.[0] ?? "", s.option?.[1] ?? "", Boolean(s.featured), i],
    );
    ids[s.name] = r.rows[0].id;
  }

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

  await c.query("INSERT INTO settings (key, value) VALUES ('demo_seeded', '1') ON CONFLICT (key) DO NOTHING");
  console.log(`[demo] added ${SAMPLES.length} sample products and ${orders.length} sample orders`);
}
