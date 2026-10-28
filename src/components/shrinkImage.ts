"use client";

/**
 * Shrinks a photo in the browser before upload: at most 2400px on the long side, JPEG.
 * Keeps uploads small and fast on mobile data, and under hosting request limits
 * (Vercel accepts at most 4.5 MB per request). The server still makes its own WebP copies.
 * If the browser can't read the format (e.g. HEIC outside Safari), the original file is used.
 */
const MAX_SIDE = 2400;
const LEAVE_ALONE_BELOW = 1.5 * 1024 * 1024;
const TARGET_MAX = 3.8 * 1024 * 1024;

export async function shrinkImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= LEAVE_ALONE_BELOW) return file;
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#fff"; // transparent PNGs get a white background, like product photos
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    // Step quality down until it fits comfortably under the 4.5 MB request limit.
    let blob: Blob | null = null;
    for (const q of [0.9, 0.8, 0.7]) {
      blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", q));
      if (!blob || blob.size <= TARGET_MAX) break;
    }
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
