import "server-only";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { deviceFromUA, isBot } from "./analytics";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

export const VISITOR_COOKIE = "ist_vid";
export const SESSION_ID_COOKIE = "ist_sid";

/**
 * Anonymous first-party ids for analytics. No personal data is stored.
 * Returns null for bots and for the signed-in store owner (so their own browsing isn't counted).
 */
export async function visitorContext() {
  const h = await headers();
  const ua = h.get("user-agent") || "";
  if (isBot(ua)) return null;
  const jar = await cookies();
  if (await verifySessionToken(jar.get(SESSION_COOKIE)?.value)) return null;
  const visitor = jar.get(VISITOR_COOKIE)?.value || crypto.randomBytes(9).toString("base64url");
  const session = jar.get(SESSION_ID_COOKIE)?.value || crypto.randomBytes(9).toString("base64url");
  const secure = h.get("x-forwarded-proto") === "https";
  jar.set(VISITOR_COOKIE, visitor, { maxAge: 60 * 60 * 24 * 365, httpOnly: true, sameSite: "lax", path: "/", secure });
  jar.set(SESSION_ID_COOKIE, session, { maxAge: 60 * 30, httpOnly: true, sameSite: "lax", path: "/", secure });
  return { visitor, session, device: deviceFromUA(ua) };
}
