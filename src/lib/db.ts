import "server-only";
import crypto from "node:crypto";
import pg from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { MIGRATIONS } from "./migrations";
import { seedDemoContent } from "./demo";

// COUNT(), SUM() and BIGINT columns come back as strings by default; every value we
// store fits comfortably in a JS number (ids, KSh amounts, counts, millisecond times).
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => Number.parseInt(v, 10));
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => Number.parseFloat(v));

export type Queryable = Pick<pg.PoolClient, "query">;

declare global {
  // eslint-disable-next-line no-var
  var __istildaPool: pg.Pool | undefined;
  // eslint-disable-next-line no-var
  var __istildaReady: Promise<void> | undefined;
}

const onVercel = Boolean(process.env.VERCEL);

/** DATABASE_URL, or POSTGRES_URL as set by some Vercel database integrations. */
export function databaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

/** Connection poolers (PgBouncer, Neon's "-pooler" hosts, Supabase's pooler) reject some session settings. */
function behindPooler(url: string) {
  if (process.env.DATABASE_POOLER) return process.env.DATABASE_POOLER === "true";
  try {
    const host = new URL(url).hostname;
    return host.includes("-pooler.") || host.includes("pooler.supabase.com");
  } catch {
    return false;
  }
}

function createPool() {
  const connectionString = databaseUrl();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Point it at your PostgreSQL database, e.g. postgres://user:pass@host:5432/istilda");
  }
  const pooled = behindPooler(connectionString);
  const pool = new pg.Pool({
    connectionString,
    // Serverless instances each hold their own small pool; a long-running server can hold more.
    max: Number(process.env.DATABASE_POOL_SIZE || (onVercel ? 5 : 10)),
    idleTimeoutMillis: onVercel ? 5_000 : 30_000,
    connectionTimeoutMillis: 10_000,
    // Stop a runaway query from tying up a connection forever. Poolers don't accept this as a
    // connection setting, so there the client-side query_timeout below does the job.
    statement_timeout: pooled ? undefined : 15_000,
    query_timeout: 20_000,
    application_name: "istilda-web",
    // Hosted URLs usually carry ?sslmode=require, which pg honours on its own.
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false" } : undefined,
  });
  pool.on("error", (err) => console.error("[db] idle client error:", err.message));
  // On Vercel, release idle connections cleanly before an instance is suspended.
  if (onVercel) attachDatabasePool(pool);
  return pool;
}

export function pool(): pg.Pool {
  if (!globalThis.__istildaPool) globalThis.__istildaPool = createPool();
  return globalThis.__istildaPool;
}

/**
 * Applies any migrations that haven't run yet, all in one transaction.
 * A transaction-scoped lock means several app instances starting at once take turns,
 * and it works through connection poolers (unlike a session lock).
 */
export async function migrate() {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(728161)");
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);
    const done = new Set((await client.query<{ id: string }>("SELECT id FROM schema_migrations")).rows.map((r) => r.id));
    for (const m of MIGRATIONS) {
      if (done.has(m.id)) continue;
      try {
        await client.query(m.sql);
      } catch (e) {
        throw new Error(`Migration ${m.id} failed: ${e instanceof Error ? e.message : e}`);
      }
      await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [m.id]);
      console.log(`[db] applied migration ${m.id}`);
    }
    await seedSettings(client);
    if (process.env.DEMO_MODE === "true") await seedDemoContent(client);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

async function seedSettings(client: Queryable) {
  const defaults: Record<string, string> = {
    whatsapp_number: process.env.WHATSAPP_NUMBER || "",
    contact_phone: process.env.WHATSAPP_NUMBER || "",
    contact_email: "",
    instagram: "",
    location_text: "Nairobi, Kenya",
    announcement: "Order online or on WhatsApp. We confirm every order with you before you pay.",
    delivery_text: "We deliver within Nairobi and ship countrywide. Delivery cost is confirmed with your order.",
    session_secret: crypto.randomBytes(32).toString("hex"),
    password_version: "1",
  };
  const keys = Object.keys(defaults);
  await client.query(
    `INSERT INTO settings (key, value) SELECT * FROM unnest($1::text[], $2::text[]) ON CONFLICT (key) DO NOTHING`,
    [keys, keys.map((k) => defaults[k])],
  );
}

/** Resolves once the schema is up to date. Every query goes through this first. */
export function ready(): Promise<void> {
  if (!globalThis.__istildaReady) {
    globalThis.__istildaReady = migrate().catch((e) => {
      globalThis.__istildaReady = undefined; // retry on the next request
      throw e;
    });
  }
  return globalThis.__istildaReady;
}

export async function query<T extends pg.QueryResultRow = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  await ready();
  return (await pool().query<T>(sql, params)).rows;
}

export async function one<T extends pg.QueryResultRow = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** Runs fn inside a transaction; rolls back if it throws. */
export async function tx<T>(fn: (c: Queryable) => Promise<T>): Promise<T> {
  await ready();
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/** Milliseconds since epoch, as returned by our SELECTs. */
export const ms = (col: string, alias = col) => `(EXTRACT(EPOCH FROM ${col}) * 1000)::bigint AS ${alias}`;
