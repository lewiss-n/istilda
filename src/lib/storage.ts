import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { del, head, put } from "@vercel/blob";
import { UPLOAD_DIR } from "./config";

/**
 * Where product photos are kept.
 *  - "blob": Vercel Blob, used automatically when BLOB_READ_WRITE_TOKEN is set (Vercel deployments).
 *  - "disk": the uploads folder in DATA_DIR (Docker / your own server).
 * Photos are always stored and referenced by the same file names, so moving between the two
 * only means copying the files across.
 */
export type StorageMode = "blob" | "disk";

export function storageMode(): StorageMode {
  return process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "disk";
}

const BLOB_PREFIX = "products/";
const ONE_YEAR = 60 * 60 * 24 * 365;

declare global {
  // eslint-disable-next-line no-var
  var __istildaBlobOrigin: string | undefined;
}

class StorageNotConfiguredError extends Error {}

function assertWritable() {
  // Vercel's file system is read-only; photos need Blob storage there.
  if (storageMode() === "disk" && process.env.VERCEL) {
    throw new StorageNotConfiguredError(
      "Photo storage isn't set up for this deployment. In Vercel, open the project's Storage tab, create a Blob store and connect it, then redeploy.",
    );
  }
}

export async function saveFile(name: string, data: Buffer, contentType: string) {
  assertWritable();
  if (storageMode() === "blob") {
    const res = await put(BLOB_PREFIX + name, data, {
      access: "public",
      addRandomSuffix: false, // names are already random and never reused
      contentType,
      cacheControlMaxAge: ONE_YEAR,
    });
    rememberBase(res.url, BLOB_PREFIX + name);
    return;
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name), data);
}

export async function deleteFiles(names: string[]) {
  if (!names.length) return;
  if (storageMode() === "blob") {
    await del(names.map((n) => BLOB_PREFIX + n)).catch((e) => console.error("[storage] delete failed:", e instanceof Error ? e.message : e));
    return;
  }
  await Promise.allSettled(names.map((n) => fs.unlink(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, n))));
}

/** Disk mode: the file's bytes, or null if it doesn't exist. */
export async function readFile(name: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(/*turbopackIgnore: true*/ UPLOAD_DIR, name));
  } catch {
    return null;
  }
}

/** Every file in a Blob store shares one base address; learn it from a real URL once. */
function rememberBase(url: string, pathname: string) {
  const clean = url.split("?")[0];
  if (clean.endsWith("/" + pathname)) globalThis.__istildaBlobOrigin = clean.slice(0, -pathname.length);
}

/** Blob mode: the public URL for a stored file, or null if it doesn't exist. */
export async function blobUrl(name: string): Promise<string | null> {
  if (globalThis.__istildaBlobOrigin) return globalThis.__istildaBlobOrigin + BLOB_PREFIX + name;
  try {
    const { url } = await head(BLOB_PREFIX + name);
    rememberBase(url, BLOB_PREFIX + name);
    return url;
  } catch {
    return null;
  }
}

export { StorageNotConfiguredError };
