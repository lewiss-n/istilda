import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { pruneEvents } from "@/lib/analytics";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Daily housekeeping for serverless hosting (scheduled in vercel.json).
 * Docker deployments do the same work from a timer inside the server.
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set on the project.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const given = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (!secret || given.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const removedEvents = await pruneEvents();
  const expired = await query<{ n: number }>(
    "WITH d AS (DELETE FROM rate_limits WHERE reset_at < now() RETURNING 1) SELECT COUNT(*) AS n FROM d",
  );
  return NextResponse.json({ ok: true, removedEvents, removedRateLimits: expired[0]?.n ?? 0 });
}
