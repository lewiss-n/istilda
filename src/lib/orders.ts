import "server-only";
import crypto from "node:crypto";
import { ms, one, query, tx } from "./db";

export const ORDER_STATUSES = ["new", "contacted", "confirmed", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderChannel = "website" | "whatsapp";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  contacted: "Contacted",
  confirmed: "Confirmed",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export type Order = {
  id: number;
  ref: string;
  channel: OrderChannel;
  status: OrderStatus;
  customer_name: string;
  phone: string;
  email: string;
  location: string;
  notes: string;
  admin_note: string;
  subtotal: number;
  item_count: number;
  created_at: number;
  updated_at: number;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  option_value: string;
  unit_price: number;
  quantity: number;
};

const COLS = `id, ref, channel, status, customer_name, phone, email, location, notes, admin_note, subtotal, item_count,
  ${ms("created_at")}, ${ms("updated_at")}`;

function newRef() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.randomBytes(6);
  let s = "";
  for (const b of bytes) s += alphabet[b % alphabet.length];
  return `IST-${s}`;
}

export type NewOrder = {
  channel: OrderChannel;
  customer_name: string;
  phone: string;
  email: string;
  location: string;
  notes: string;
  items: Omit<OrderItem, "id" | "order_id">[];
};

export async function createOrder(o: NewOrder): Promise<Order> {
  const subtotal = o.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const count = o.items.reduce((s, i) => s + i.quantity, 0);
  return tx(async (c) => {
    let order: Order | undefined;
    // A reference clash is astronomically rare; ON CONFLICT lets us just pick another.
    for (let attempt = 0; !order && attempt < 5; attempt++) {
      const { rows } = await c.query<Order>(
        `INSERT INTO orders (ref, channel, customer_name, phone, email, location, notes, subtotal, item_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (ref) DO NOTHING
         RETURNING ${COLS}`,
        [newRef(), o.channel, o.customer_name, o.phone, o.email, o.location, o.notes, subtotal, count],
      );
      order = rows[0];
    }
    if (!order) throw new Error("Could not create an order reference");
    await c.query(
      `INSERT INTO order_items (order_id, product_id, product_name, option_value, unit_price, quantity)
       SELECT $1, * FROM unnest($2::int[], $3::text[], $4::text[], $5::int[], $6::int[])`,
      [
        order.id,
        o.items.map((i) => i.product_id),
        o.items.map((i) => i.product_name),
        o.items.map((i) => i.option_value),
        o.items.map((i) => i.unit_price),
        o.items.map((i) => i.quantity),
      ],
    );
    return order;
  });
}

const validId = (id: number) => Number.isInteger(id) && id > 0 && id < 2 ** 31;

export async function getOrder(id: number): Promise<Order | null> {
  if (!validId(id)) return null;
  return one<Order>(`SELECT ${COLS} FROM orders WHERE id = $1`, [id]);
}

export async function getOrderByRef(ref: string): Promise<Order | null> {
  return one<Order>(`SELECT ${COLS} FROM orders WHERE ref = $1`, [ref]);
}

export async function getOrderItems(orderId: number): Promise<OrderItem[]> {
  return query<OrderItem>("SELECT * FROM order_items WHERE order_id = $1 ORDER BY id", [orderId]);
}

export async function listOrders(f: { status?: string; channel?: string; q?: string; limit?: number } = {}): Promise<Order[]> {
  const where: string[] = [];
  const args: unknown[] = [];
  if (f.status) {
    args.push(f.status);
    where.push(`status = $${args.length}`);
  }
  if (f.channel) {
    args.push(f.channel);
    where.push(`channel = $${args.length}`);
  }
  if (f.q) {
    const like = `%${f.q.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
    const digits = f.q.replace(/[^\d]/g, "");
    args.push(like, digits ? `%${digits.replace(/^0/, "")}%` : like);
    where.push(`(ref ILIKE $${args.length - 1} OR customer_name ILIKE $${args.length - 1} OR phone LIKE $${args.length})`);
  }
  args.push(Math.min(f.limit ?? 500, 2000));
  return query<Order>(
    `SELECT ${COLS} FROM orders ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY created_at DESC LIMIT $${args.length}`,
    args,
  );
}

export async function countNewOrders(): Promise<number> {
  return (await one<{ n: number }>("SELECT COUNT(*) AS n FROM orders WHERE status = 'new'"))?.n ?? 0;
}

export async function statusCounts(): Promise<Record<string, number>> {
  const rows = await query<{ status: string; n: number }>("SELECT status, COUNT(*) AS n FROM orders GROUP BY status");
  return Object.fromEntries(rows.map((r) => [r.status, r.n]));
}

export async function updateOrder(id: number, status: OrderStatus, adminNote: string) {
  await query("UPDATE orders SET status = $1, admin_note = $2, updated_at = now() WHERE id = $3", [status, adminNote, id]);
}

export async function deleteOrder(id: number) {
  if (!validId(id)) return;
  await query("DELETE FROM orders WHERE id = $1", [id]);
}
