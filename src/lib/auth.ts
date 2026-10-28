import "server-only";
import crypto from "node:crypto";
import { promisify } from "node:util";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { one, query } from "./db";
import { setSettings } from "./settings";

const scrypt = promisify(crypto.scrypt) as (password: string, salt: string, keylen: number) => Promise<Buffer>;

export const SESSION_COOKIE = "ist_admin";
const SESSION_DAYS = 7;

async function authSettings() {
  const rows = await query<{ key: string; value: string }>(
    "SELECT key, value FROM settings WHERE key IN ('session_secret', 'password_version', 'admin_password_hash')",
  );
  const m = new Map(rows.map((r) => [r.key, r.value]));
  return {
    secret: process.env.SESSION_SECRET || m.get("session_secret") || "",
    version: m.get("password_version") || "1",
    passwordHash: m.get("admin_password_hash") || "",
  };
}

function sign(data: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(data).digest("base64url");
}

export async function createSessionToken() {
  const { secret, version } = await authSettings();
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_DAYS * 864e5, v: version })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const { secret, version } = await authSettings();
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(payload, secret));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number; v: string };
    return data.exp > Date.now() && data.v === version;
  } catch {
    return false;
  }
}

export async function isAdmin() {
  const jar = await cookies();
  return verifySessionToken(jar.get(SESSION_COOKIE)?.value);
}

/** Use at the top of every admin page, server action and admin API route. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

// ---- Passwords ----

async function hashPassword(password: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = (await scrypt(password, salt, 64)).toString("hex");
  return `${salt}:${hash}`;
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export async function checkPassword(password: string): Promise<boolean> {
  const { passwordHash } = await authSettings();
  if (passwordHash) {
    const [salt, hash] = passwordHash.split(":");
    return safeEqual((await hashPassword(password, salt)).split(":")[1], hash);
  }
  const envPassword = process.env.ADMIN_PASSWORD;
  if (!envPassword) return false;
  // Hash both sides so comparison time doesn't depend on length.
  return safeEqual(await hashPassword(password, "env"), await hashPassword(envPassword, "env"));
}

export async function changePassword(newPassword: string) {
  const { version } = await authSettings();
  await setSettings({
    admin_password_hash: await hashPassword(newPassword),
    password_version: String(Number(version) + 1), // signs out every other session
  });
}

export async function passwordConfigured() {
  const { passwordHash } = await authSettings();
  return Boolean(passwordHash || process.env.ADMIN_PASSWORD);
}

export async function isSecureRequest() {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  const h = await headers();
  return h.get("x-forwarded-proto") === "https";
}

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "local").trim();
}

// ---- Rate limiting ----

/**
 * Counts one attempt for `key` and returns false once it's over `limit` within the window.
 * Stored in the database, so limits hold across restarts and multiple app instances.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const row = await one<{ count: number }>(
    `INSERT INTO rate_limits (key, count, reset_at) VALUES ($1, 1, now() + $2 * interval '1 millisecond')
     ON CONFLICT (key) DO UPDATE SET
       count    = CASE WHEN rate_limits.reset_at < now() THEN 1 ELSE rate_limits.count + 1 END,
       reset_at = CASE WHEN rate_limits.reset_at < now() THEN EXCLUDED.reset_at ELSE rate_limits.reset_at END
     RETURNING count`,
    [key, windowMs],
  );
  // Occasionally clear out expired rows.
  if (Math.random() < 0.01) await query("DELETE FROM rate_limits WHERE reset_at < now()").catch(() => {});
  return (row?.count ?? 0) <= limit;
}

/** True if `key` has already used up its allowance (doesn't count as an attempt). */
export async function isRateLimited(key: string, limit: number): Promise<boolean> {
  const row = await one<{ count: number }>("SELECT count FROM rate_limits WHERE key = $1 AND reset_at >= now()", [key]);
  return (row?.count ?? 0) >= limit;
}

/** Cheap per-instance limiter for high-volume, low-stakes endpoints (analytics beacons). */
const buckets = new Map<string, { count: number; reset: number }>();
export function memoryRateLimit(key: string, limit: number, windowMs: number) {
  const t = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < t) {
    buckets.set(key, { count: 1, reset: t + windowMs });
    if (buckets.size > 5000) for (const [k, v] of buckets) if (v.reset < t) buckets.delete(k);
    return true;
  }
  b.count++;
  return b.count <= limit;
}
