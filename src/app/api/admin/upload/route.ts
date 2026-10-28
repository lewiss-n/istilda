import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { saveProductImage } from "@/lib/images";
import { StorageNotConfiguredError } from "@/lib/storage";

export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No image received." }, { status: 400 });
  try {
    const filename = await saveProductImage(file);
    return NextResponse.json({ filename });
  } catch (e) {
    if (e instanceof StorageNotConfiguredError) return NextResponse.json({ error: e.message }, { status: 503 });
    const message = e instanceof Error ? e.message : "Upload failed.";
    console.error("[upload]", message);
    const friendly =
      message.includes("Input") || message.includes("unsupported image")
        ? "That file isn't a readable image."
        : message.startsWith("Please upload") || message.startsWith("Images must")
          ? message
          : "The photo couldn't be saved. Please try again.";
    return NextResponse.json({ error: friendly }, { status: 400 });
  }
}
