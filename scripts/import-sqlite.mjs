// One-off: copy products, orders, settings and analytics from the old SQLite database
// (data/istilda.db) into PostgreSQL. Product photos stay where they are.
//
// With Docker:   docker compose exec web node scripts/import-sqlite.mjs
// Without:       DATABASE_URL=postgres://... node scripts/import-sqlite.mjs [path/to/istilda.db]
//
// Start the new site once before running this, so the PostgreSQL tables exist.
// It refuses to run if PostgreSQL already has products or orders, so nothing is overwritten.

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";

const file = process.argv[2] || path.join(process.env.DATA_DIR || "data", "istilda.db");
if (!fs.existsSync(file)) {
  console.log(`No SQLite database at ${file}. Nothing to import.`);
  process.exit(0);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const lite = new DatabaseSync(file, { readOnly: true });
const all = (sql) => lite.prepare(sql).all();
const ts = (msVal) => new Date(Number(msVal)).toISOString();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  const { rows: [t] } = await client.query("SELECT to_regclass('public.products') AS t");
  if (!t.t) throw new Error("The PostgreSQL tables don't exist yet. Start the website once, then run this again.");
  const { rows: [c] } = await client.query("SELECT (SELECT COUNT(*) FROM products) + (SELECT COUNT(*) FROM orders) AS n");
  if (Number(c.n) > 0) throw new Error("PostgreSQL already has products or orders. Import stopped so nothing is overwritten.");

  await client.query("BEGIN");

  const settings = all("SELECT key, value FROM settings");
  for (const s of settings) {
    await client.query("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [s.key, s.value]);
  }

  const products = all("SELECT * FROM products");
  for (const p of products) {
    await client.query(
      `INSERT INTO products (id, name, slug, category, description, price, compare_price, option_label, option_values, in_stock, featured, created_at, updated_at)
       OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [p.id, p.name, p.slug, p.category, p.description, p.price, p.compare_price, p.option_label, p.option_values, Boolean(p.in_stock), Boolean(p.featured), ts(p.created_at), ts(p.updated_at)],
    );
  }
  const images = all("SELECT * FROM product_images");
  for (const i of images) {
    await client.query("INSERT INTO product_images (id, product_id, filename, sort) OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4)", [i.id, i.product_id, i.filename, i.sort]);
  }

  const orders = all("SELECT * FROM orders");
  for (const o of orders) {
    await client.query(
      `INSERT INTO orders (id, ref, channel, status, customer_name, phone, email, location, notes, admin_note, subtotal, item_count, created_at, updated_at)
       OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
      [o.id, o.ref, o.channel, o.status, o.customer_name, o.phone, o.email, o.location, o.notes, o.admin_note, o.subtotal, o.item_count, ts(o.created_at), ts(o.updated_at)],
    );
  }
  const productIds = new Set(products.map((p) => p.id));
  const items = all("SELECT * FROM order_items");
  for (const i of items) {
    await client.query(
      `INSERT INTO order_items (id, order_id, product_id, product_name, option_value, unit_price, quantity)
       OVERRIDING SYSTEM VALUE VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [i.id, i.order_id, productIds.has(i.product_id) ? i.product_id : null, i.product_name, i.option_value, i.unit_price, i.quantity],
    );
  }

  const events = all("SELECT * FROM events");
  for (const e of events) {
    await client.query(
      `INSERT INTO events (type, path, product_id, visitor, session, referrer, device, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [e.type, e.path, productIds.has(e.product_id) ? e.product_id : null, e.visitor, e.session, e.referrer, e.device, ts(e.created_at)],
    );
  }

  // Make new rows continue after the imported ids.
  for (const table of ["products", "product_images", "orders", "order_items"]) {
    await client.query(
      `SELECT setval(pg_get_serial_sequence('${table}', 'id'), GREATEST((SELECT COALESCE(MAX(id), 0) FROM ${table}), 1), (SELECT COUNT(*) > 0 FROM ${table}))`,
    );
  }

  await client.query("COMMIT");
  console.log(
    `Imported ${products.length} products, ${images.length} photos, ${orders.length} orders, ${items.length} order items, ` +
      `${events.length} analytics events and ${settings.length} settings.`,
  );
  console.log(`You can now delete ${file} (keep a copy until you've checked everything looks right).`);
} catch (e) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("Import failed:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
  lite.close();
}
