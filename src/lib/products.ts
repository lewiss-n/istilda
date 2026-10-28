import "server-only";
import { ms, one, query, tx, type Queryable } from "./db";
import { slugify } from "./format";

export type Product = {
  id: number;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: number;
  compare_price: number | null;
  option_label: string;
  option_values: string;
  in_stock: boolean;
  featured: boolean;
  created_at: number;
  updated_at: number;
  images: string[];
};

const SELECT = `
SELECT p.id, p.name, p.slug, p.category, p.description, p.price, p.compare_price, p.option_label, p.option_values,
       p.in_stock, p.featured, ${ms("p.created_at", "created_at")}, ${ms("p.updated_at", "updated_at")},
       COALESCE((SELECT array_agg(i.filename ORDER BY i.sort, i.id) FROM product_images i WHERE i.product_id = p.id), '{}') AS images
FROM products p`;

export function optionList(p: Pick<Product, "option_values">) {
  return p.option_values
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type ProductQuery = {
  category?: string;
  q?: string;
  sort?: string;
  featured?: boolean;
  limit?: number;
};

export async function listProducts(q: ProductQuery = {}): Promise<Product[]> {
  const where: string[] = [];
  const args: unknown[] = [];
  if (q.category) {
    args.push(q.category);
    where.push(`p.category = $${args.length}`);
  }
  if (q.q) {
    args.push(`%${q.q.replace(/[\\%_]/g, (c) => "\\" + c)}%`);
    where.push(`(p.name ILIKE $${args.length} OR p.description ILIKE $${args.length})`);
  }
  if (q.featured) where.push("p.featured");
  const order =
    q.sort === "price-asc"
      ? "p.price ASC, p.id"
      : q.sort === "price-desc"
        ? "p.price DESC, p.id"
        : q.sort === "name"
          ? "lower(p.name) ASC, p.id"
          : "p.in_stock DESC, p.created_at DESC, p.id DESC";
  if (q.limit) args.push(Math.floor(q.limit));
  return query<Product>(
    `${SELECT} ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY ${order} ${q.limit ? `LIMIT $${args.length}` : ""}`,
    args,
  );
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return one<Product>(`${SELECT} WHERE p.slug = $1`, [slug]);
}

export async function getProduct(id: number): Promise<Product | null> {
  if (!Number.isInteger(id) || id <= 0 || id > 2 ** 31 - 1) return null;
  return one<Product>(`${SELECT} WHERE p.id = $1`, [id]);
}

export async function getProductsByIds(ids: number[]): Promise<Product[]> {
  const clean = ids.filter((n) => Number.isInteger(n) && n > 0 && n < 2 ** 31);
  if (!clean.length) return [];
  return query<Product>(`${SELECT} WHERE p.id = ANY($1::int[])`, [clean]);
}

export async function categoryCounts(): Promise<Record<string, number>> {
  const rows = await query<{ category: string; n: number }>("SELECT category, COUNT(*) AS n FROM products GROUP BY category");
  return Object.fromEntries(rows.map((r) => [r.category, r.n]));
}

export type ProductInput = {
  name: string;
  category: string;
  description: string;
  price: number;
  compare_price: number | null;
  option_label: string;
  option_values: string;
  in_stock: boolean;
  featured: boolean;
  images: string[];
};

async function uniqueSlug(c: Queryable, name: string, excludeId?: number) {
  const base = slugify(name) || "product";
  const taken = new Set(
    (await c.query<{ slug: string }>("SELECT slug FROM products WHERE (slug = $1 OR slug LIKE $2) AND id <> $3", [base, `${base}-%`, excludeId ?? -1])).rows.map(
      (r) => r.slug,
    ),
  );
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

async function setImages(c: Queryable, productId: number, images: string[]) {
  await c.query("DELETE FROM product_images WHERE product_id = $1", [productId]);
  if (images.length) {
    await c.query(
      "INSERT INTO product_images (product_id, filename, sort) SELECT $1, f, o - 1 FROM unnest($2::text[]) WITH ORDINALITY AS t(f, o)",
      [productId, images],
    );
  }
}

export async function createProduct(input: ProductInput): Promise<number> {
  return tx(async (c) => {
    const slug = await uniqueSlug(c, input.name);
    const { rows } = await c.query<{ id: number }>(
      `INSERT INTO products (name, slug, category, description, price, compare_price, option_label, option_values, in_stock, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [input.name, slug, input.category, input.description, input.price, input.compare_price, input.option_label, input.option_values, input.in_stock, input.featured],
    );
    await setImages(c, rows[0].id, input.images);
    return rows[0].id;
  });
}

export async function updateProduct(id: number, input: ProductInput) {
  await tx(async (c) => {
    const { rows } = await c.query<{ name: string; slug: string }>("SELECT name, slug FROM products WHERE id = $1 FOR UPDATE", [id]);
    if (!rows[0]) throw new Error("Product not found");
    const slug = rows[0].name === input.name ? rows[0].slug : await uniqueSlug(c, input.name, id);
    await c.query(
      `UPDATE products SET name=$1, slug=$2, category=$3, description=$4, price=$5, compare_price=$6, option_label=$7,
         option_values=$8, in_stock=$9, featured=$10, updated_at=now() WHERE id=$11`,
      [input.name, slug, input.category, input.description, input.price, input.compare_price, input.option_label, input.option_values, input.in_stock, input.featured, id],
    );
    await setImages(c, id, input.images);
  });
}

export async function setInStock(id: number, inStock: boolean) {
  await query("UPDATE products SET in_stock = $1, updated_at = now() WHERE id = $2", [inStock, id]);
}

export async function deleteProduct(id: number) {
  await query("DELETE FROM products WHERE id = $1", [id]);
}

/** Image files no product references any more (after edits or deletes). */
export async function isImageInUse(filename: string) {
  return Boolean(await one("SELECT 1 FROM product_images WHERE filename = $1 LIMIT 1", [filename]));
}
