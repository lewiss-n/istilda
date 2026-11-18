import "server-only";
import crypto from "node:crypto";
import sharp from "sharp";
import { deleteFiles, saveFile } from "./storage";

// Small-server friendly: one image-processing thread and a small cache, so a photo upload
// can't push a 1 GB server into swap. Uploads are occasional, so the speed difference is tiny.
sharp.concurrency(1);
sharp.cache({ memory: 32, files: 0, items: 50 });

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/heic", "image/heif"];
export const FILENAME_RE = /^[a-f0-9]{24}(-sm)?\.webp$/;

// Photos are processed one at a time. A full-size phone photo takes ~50 MB to decode, so
// several uploads at once could otherwise push a 1 GB server over its memory limit.
let queue: Promise<unknown> = Promise.resolve();
function oneAtATime<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.catch(() => undefined);
  return run;
}

/** Saves a resized large image and a small thumbnail. Returns the base filename. */
export async function saveProductImage(file: File): Promise<string> {
  if (!ACCEPTED.includes(file.type)) throw new Error("Please upload a JPG, PNG, WebP or AVIF image.");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("Images must be 12 MB or smaller.");
  const input = Buffer.from(await file.arrayBuffer());
  const id = crypto.randomBytes(12).toString("hex");
  const { large, small } = await oneAtATime(async () => {
    const large = await sharp(input, { failOn: "error" })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    // The thumbnail is made from the 1600px version: much less memory than decoding the original again.
    const small = await sharp(large).resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
    return { large, small };
  });
  await Promise.all([saveFile(`${id}.webp`, large, "image/webp"), saveFile(`${id}-sm.webp`, small, "image/webp")]);
  return `${id}.webp`;
}

export async function deleteImageFiles(filename: string) {
  if (!FILENAME_RE.test(filename)) return;
  await deleteFiles([filename, filename.replace(".webp", "-sm.webp")]);
}
