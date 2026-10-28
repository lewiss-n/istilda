import path from "node:path";

/** Product photos live here (a Docker volume in production). The database itself is PostgreSQL. */
export const DATA_DIR = path.resolve(/*turbopackIgnore: true*/ process.env.DATA_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "data"));
export const UPLOAD_DIR = path.join(/*turbopackIgnore: true*/ DATA_DIR, "uploads");

/** Analytics are grouped by day in this time zone. */
export const STORE_TIMEZONE = process.env.STORE_TIMEZONE || "Africa/Nairobi";

export const STORE_NAME = "Istilda Importers";
