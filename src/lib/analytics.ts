import "server-only";
import { one, query } from "./db";
import { STORE_TIMEZONE } from "./config";

export const EVENT_TYPES = ["pageview", "product_view", "add_to_cart", "whatsapp_click", "order"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export async function recordEvent(e: {
  type: EventType;
  path?: string;
  product_id?: number | null;
  visitor: string;
  session: string;
  referrer?: string;
  device?: string;
}) {
  await query(
    "INSERT INTO events (type, path, product_id, visitor, session, referrer, device) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [e.type, (e.path ?? "").slice(0, 300), e.product_id ?? null, e.visitor.slice(0, 40), e.session.slice(0, 40), (e.referrer ?? "").slice(0, 200), e.device ?? ""],
  );
}

/** Deletes analytics events older than ANALYTICS_RETENTION_DAYS (default 400) to keep the table lean. */
export async function pruneEvents() {
  const days = Math.max(30, Number(process.env.ANALYTICS_RETENTION_DAYS || 400));
  const rows = await query<{ n: number }>(
    "WITH d AS (DELETE FROM events WHERE created_at < now() - $1 * interval '1 day' RETURNING 1) SELECT COUNT(*) AS n FROM d",
    [days],
  );
  return rows[0]?.n ?? 0;
}

export function deviceFromUA(ua: string) {
  if (/ipad|tablet|playbook|silk/i.test(ua)) return "Tablet";
  if (/mobi|android|iphone|ipod/i.test(ua)) return "Mobile";
  return "Desktop";
}

export function isBot(ua: string) {
  return !ua || /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|monitor|curl|wget|python|axios/i.test(ua);
}

export type DailyPoint = { day: string; visitors: number; pageviews: number; orders: number };

const localDay = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: STORE_TIMEZONE }).format(d); // YYYY-MM-DD

type Kpi = {
  visitors: number;
  sessions: number;
  pageviews: number;
  productViews: number;
  addToCart: number;
  waClicks: number;
  orderSessions: number;
  productViewSessions: number;
  cartSessions: number;
  orders: number;
  orderValue: number;
  websiteOrders: number;
  whatsappOrders: number;
};

async function kpi(fromDays: number, toDays: number): Promise<Kpi> {
  const range = [fromDays, toDays];
  const [ev, ord] = await Promise.all([
    one<Omit<Kpi, "orders" | "orderValue" | "websiteOrders" | "whatsappOrders">>(
      `SELECT COUNT(DISTINCT visitor) AS visitors,
              COUNT(DISTINCT session) AS sessions,
              COUNT(*) FILTER (WHERE type = 'pageview') AS pageviews,
              COUNT(*) FILTER (WHERE type = 'product_view') AS "productViews",
              COUNT(*) FILTER (WHERE type = 'add_to_cart') AS "addToCart",
              COUNT(*) FILTER (WHERE type = 'whatsapp_click') AS "waClicks",
              COUNT(DISTINCT session) FILTER (WHERE type = 'order') AS "orderSessions",
              COUNT(DISTINCT session) FILTER (WHERE type = 'product_view') AS "productViewSessions",
              COUNT(DISTINCT session) FILTER (WHERE type = 'add_to_cart') AS "cartSessions"
       FROM events
       WHERE created_at >= now() - $1 * interval '1 day' AND created_at < now() - $2 * interval '1 day'`,
      range,
    ),
    one<{ orders: number; orderValue: number; websiteOrders: number; whatsappOrders: number }>(
      `SELECT COUNT(*) AS orders,
              COALESCE(SUM(subtotal) FILTER (WHERE status <> 'cancelled'), 0) AS "orderValue",
              COUNT(*) FILTER (WHERE channel = 'website') AS "websiteOrders",
              COUNT(*) FILTER (WHERE channel = 'whatsapp') AS "whatsappOrders"
       FROM orders
       WHERE created_at >= now() - $1 * interval '1 day' AND created_at < now() - $2 * interval '1 day'`,
      range,
    ),
  ]);
  return { ...ev!, ...ord! };
}

export async function dashboardStats(days: number) {
  const tz = STORE_TIMEZONE;
  const [current, previous, evDaily, ordDaily, topPages, topProducts, ordered, referrers, devices, live] = await Promise.all([
    kpi(days, 0),
    kpi(days * 2, days),
    query<{ day: string; visitors: number; pageviews: number }>(
      `SELECT to_char(created_at AT TIME ZONE $2, 'YYYY-MM-DD') AS day,
              COUNT(DISTINCT visitor) AS visitors, COUNT(*) FILTER (WHERE type = 'pageview') AS pageviews
       FROM events WHERE created_at >= now() - $1 * interval '1 day' GROUP BY 1`,
      [days, tz],
    ),
    query<{ day: string; orders: number }>(
      `SELECT to_char(created_at AT TIME ZONE $2, 'YYYY-MM-DD') AS day, COUNT(*) AS orders
       FROM orders WHERE created_at >= now() - $1 * interval '1 day' GROUP BY 1`,
      [days, tz],
    ),
    query<{ path: string; views: number; visitors: number }>(
      `SELECT path, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors FROM events
       WHERE type = 'pageview' AND created_at >= now() - $1 * interval '1 day'
       GROUP BY path ORDER BY views DESC LIMIT 8`,
      [days],
    ),
    query<{ id: number; name: string; slug: string; views: number; adds: number }>(
      `SELECT p.id, p.name, p.slug,
              COUNT(*) FILTER (WHERE e.type = 'product_view') AS views,
              COUNT(*) FILTER (WHERE e.type = 'add_to_cart') AS adds
       FROM events e JOIN products p ON p.id = e.product_id
       WHERE e.created_at >= now() - $1 * interval '1 day'
       GROUP BY p.id ORDER BY views DESC, adds DESC LIMIT 8`,
      [days],
    ),
    query<{ name: string; qty: number; value: number }>(
      `SELECT oi.product_name AS name, SUM(oi.quantity) AS qty, SUM(oi.quantity * oi.unit_price) AS value
       FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.created_at >= now() - $1 * interval '1 day' AND o.status <> 'cancelled'
       GROUP BY oi.product_name ORDER BY qty DESC, value DESC LIMIT 6`,
      [days],
    ),
    query<{ source: string; visitors: number }>(
      `SELECT CASE WHEN referrer = '' THEN 'Direct / unknown' ELSE referrer END AS source, COUNT(DISTINCT visitor) AS visitors
       FROM events WHERE type = 'pageview' AND created_at >= now() - $1 * interval '1 day'
       GROUP BY 1 ORDER BY visitors DESC LIMIT 8`,
      [days],
    ),
    query<{ device: string; visitors: number }>(
      `SELECT device, COUNT(DISTINCT visitor) AS visitors FROM events
       WHERE created_at >= now() - $1 * interval '1 day' AND device <> ''
       GROUP BY device ORDER BY visitors DESC`,
      [days],
    ),
    one<{ n: number }>("SELECT COUNT(DISTINCT visitor) AS n FROM events WHERE created_at >= now() - interval '5 minutes'"),
  ]);

  // One point per local day, including days with no activity.
  const evMap = new Map(evDaily.map((r) => [r.day, r]));
  const ordMap = new Map(ordDaily.map((r) => [r.day, r.orders]));
  const series: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = localDay(new Date(Date.now() - i * 864e5));
    const e = evMap.get(day);
    series.push({ day, visitors: e?.visitors ?? 0, pageviews: e?.pageviews ?? 0, orders: ordMap.get(day) ?? 0 });
  }

  return { current, previous, series, topPages, topProducts, ordered, referrers, devices, liveVisitors: live?.n ?? 0 };
}
