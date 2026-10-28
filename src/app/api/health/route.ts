import { one } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Used by Docker's health check: healthy only when the database answers. */
export async function GET() {
  try {
    await one("SELECT 1");
    return Response.json({ ok: true, database: "up" });
  } catch {
    return Response.json({ ok: false, database: "down" }, { status: 503 });
  }
}
