import { FILENAME_RE } from "@/lib/images";
import { blobUrl, readFile, storageMode } from "@/lib/storage";

// Filenames are random and never reused, so responses can be cached for a long time.
const CACHE = "public, max-age=31536000, immutable";

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  if (!FILENAME_RE.test(name)) return new Response("Not found", { status: 404 });

  if (storageMode() === "blob") {
    // Send the browser straight to Vercel Blob's CDN. Vercel caches this redirect at the edge too.
    const url = await blobUrl(name);
    if (!url) return new Response("Not found", { status: 404 });
    return new Response(null, { status: 308, headers: { Location: url, "Cache-Control": CACHE } });
  }

  const buf = await readFile(name);
  if (!buf) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(buf), { headers: { "Content-Type": "image/webp", "Cache-Control": CACHE } });
}
