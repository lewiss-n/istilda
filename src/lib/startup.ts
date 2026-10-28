import { databaseUrl, ready } from "./db";
import { pruneEvents } from "./analytics";

declare global {
  // eslint-disable-next-line no-var
  var __istildaStarted: boolean | undefined;
}

export async function startup() {
  if (globalThis.__istildaStarted) return;
  globalThis.__istildaStarted = true;

  if (!databaseUrl()) {
    console.error("[db] DATABASE_URL is not set — the store can't start without its database.");
    return;
  }

  if (process.env.VERCEL) {
    // Serverless: try once so the first visitor doesn't wait on migrations, but never block or
    // crash a cold start. Any request retries automatically. Clean-up runs from Vercel Cron.
    await ready().then(
      () => console.log("[db] connected, schema up to date"),
      (e) => console.error("[db] not ready yet, will retry on the next request:", e instanceof Error ? e.message : e),
    );
    return;
  }

  // Long-running server (Docker): wait for the database, which may still be starting, then migrate.
  for (let attempt = 1; ; attempt++) {
    try {
      await ready();
      console.log("[db] connected, schema up to date");
      break;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (attempt >= 30 || msg.startsWith("Migration")) {
        console.error("[db] could not get the database ready:", msg);
        throw e;
      }
      console.warn(`[db] waiting for database (attempt ${attempt}): ${msg}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Trim old analytics once a day.
  const prune = () =>
    pruneEvents()
      .then((n) => n && console.log(`[analytics] removed ${n} old events`))
      .catch((e) => console.error("[analytics] prune failed:", e instanceof Error ? e.message : e));
  prune();
  setInterval(prune, 24 * 60 * 60 * 1000).unref();
}
