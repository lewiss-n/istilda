/**
 * Runs once when the server starts: brings the database schema up to date before
 * the first request, schedules analytics clean-up and closes connections on shutdown.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { startup } = await import("./lib/startup");
  await startup();
}
