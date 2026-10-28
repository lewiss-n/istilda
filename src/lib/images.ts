import "server-only";
import crypto from "node:crypto";
import sharp from "sharp";
import { deleteFiles, saveFile } from "./storage";

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/heic", "image/heif"];
export const FILENAME_RE = /^[a-f0-9]{24}(-sm)?\.webp$/;

/** Saves a resized large image and a small thumbnail. Returns the base filename. */
export async function saveProductImage(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type)) throw new Error("Please upload a JPG, PNG, WebP or AVIF image.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Images must be 12 MB or smaller.");
  const input = Buffer.from(await file.arrayBuffer());
  const id = crypto.randomBytes(12).toString("hex");
  const base = sharp(input, { failOn: "error" }).rotate();
  const [large, small] = await Promise.all([
    base.clone().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
    base.clone().resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toBuffer(),
  ]);
  await Promise.all([saveFile(`${id}.webp`, large, "image/webp"), saveFile(`${id}-sm.webp`, small, "image/webp")]);
  return `${id}.webp`;
}

export async function deleteImageFiles(filename: string) {
  if (!FILENAME_RE.test(filename)) return;
  await deleteFiles([filename, filename.replace(".webp", "-sm.webp")]);
}
