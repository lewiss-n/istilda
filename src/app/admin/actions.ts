"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  SESSION_COOKIE,
  changePassword,
  checkPassword,
  clientIp,
  createSessionToken,
  isRateLimited,
  isSecureRequest,
  rateLimit,
  requireAdmin,
} from "@/lib/auth";
import { CATEGORY_MAP } from "@/lib/categories";
import { createProduct, deleteProduct, getProduct, setInStock, getProductsByIds, isImageInUse, updateProduct, type ProductInput } from "@/lib/products";
import { deleteImageFiles, FILENAME_RE } from "@/lib/images";
import { ORDER_STATUSES, createOrder, deleteOrder, getOrder, updateOrder, type OrderStatus } from "@/lib/orders";
import { PUBLIC_KEYS, setSettings } from "@/lib/settings";
import { normalizePhone } from "@/lib/format";
import { isDemo } from "@/lib/demo";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; ok?: string } | undefined;

const str = (fd: FormData, k: string, max = 500) => String(fd.get(k) ?? "").trim().slice(0, max);

// ---------- Auth ----------

export async function loginAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const key = "login:" + (await clientIp());
  if (await isRateLimited(key, 6)) {
    return { error: "Too many wrong attempts. Please wait 15 minutes and try again." };
  }
  const password = String(fd.get("password") ?? "");
  if (!await checkPassword(password)) {
    await rateLimit(key, 6, 15 * 60_000); // only wrong passwords count
    await new Promise((r) => setTimeout(r, 400));
    return { error: "That password isn't right." };
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: await isSecureRequest(),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/admin");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/admin/login");
}

// ---------- Products ----------

function parseMoney(v: string) {
  const n = Number(v.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : NaN;
}

function readProduct(fd: FormData): { input?: ProductInput; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = str(fd, "name", 140);
  const category = str(fd, "category", 40);
  const description = String(fd.get("description") ?? "").trim().slice(0, 5000);
  const price = parseMoney(str(fd, "price", 20));
  const compareRaw = str(fd, "compare_price", 20);
  const compare = compareRaw ? parseMoney(compareRaw) : null;
  const option_label = str(fd, "option_label", 40);
  const option_values = str(fd, "option_values", 600)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
  let images: string[] = [];
  try {
    images = (JSON.parse(String(fd.get("images") ?? "[]")) as string[]).filter((f) => FILENAME_RE.test(f)).slice(0, 12);
  } catch {}

  if (name.length < 2) errors.name = "Give the product a name.";
  if (!CATEGORY_MAP.has(category)) errors.category = "Choose a category.";
  if (!Number.isFinite(price) || price <= 0) errors.price = "Enter a price in KSh, e.g. 4500.";
  if (compare !== null && (!Number.isFinite(compare) || compare <= 0)) errors.compare_price = "Enter a number, or leave it empty.";
  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    input: {
      name,
      category,
      description,
      price,
      compare_price: compare && compare > price ? compare : null,
      option_label: option_values ? option_label || "Option" : "",
      option_values,
      in_stock: fd.get("in_stock") === "on",
      featured: fd.get("featured") === "on",
      images,
    },
  };
}

async function cleanupImages(filenames: string[]) {
  for (const f of filenames) if (!await isImageInUse(f)) await deleteImageFiles(f);
}

export async function saveProductAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("id") || 0);
  const { input, errors } = readProduct(fd);
  if (!input) return { error: "Please fix the highlighted fields.", fieldErrors: errors };
  if (id) {
    const before = await getProduct(id);
    if (!before) return { error: "This product no longer exists." };
    await updateProduct(id, input);
    await cleanupImages(before.images.filter((f) => !input.images.includes(f)));
  } else {
    await createProduct(input);
  }
  revalidatePath("/", "layout");
  redirect(`/admin/products?saved=${encodeURIComponent(input.name)}`);
}

export async function deleteProductAction(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const p = await getProduct(id);
  if (p) {
    await deleteProduct(id);
    await cleanupImages(p.images);
  }
  revalidatePath("/", "layout");
  redirect("/admin/products?deleted=1");
}

export async function toggleStockAction(fd: FormData) {
  await requireAdmin();
  const p = await getProduct(Number(fd.get("id")));
  if (!p) return;
  await setInStock(p.id, !p.in_stock);
  revalidatePath("/", "layout");
}

// ---------- Orders ----------

export async function updateOrderAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const status = String(fd.get("status")) as OrderStatus;
  if (!await getOrder(id)) return { error: "Order not found." };
  if (!ORDER_STATUSES.includes(status)) return { error: "Choose a status." };
  await updateOrder(id, status, String(fd.get("admin_note") ?? "").slice(0, 2000));
  revalidatePath("/admin", "layout");
  return { ok: "Saved." };
}

export async function deleteOrderAction(fd: FormData) {
  await requireAdmin();
  await deleteOrder(Number(fd.get("id")));
  revalidatePath("/admin", "layout");
  redirect("/admin/orders?deleted=1");
}

/** For orders that arrive straight in WhatsApp (or by phone) without the website form. */
export async function createManualOrderAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const errors: Record<string, string> = {};
  const name = str(fd, "name", 100);
  const phone = normalizePhone(str(fd, "phone", 30));
  if (name.length < 2) errors.name = "Enter the customer's name.";
  if (phone.length < 9) errors.phone = "Enter the customer's phone number.";

  let lines: { productId?: number; name?: string; price?: number; qty?: number; option?: string }[] = [];
  try {
    lines = JSON.parse(String(fd.get("lines") ?? "[]"));
  } catch {}
  const products = new Map((await getProductsByIds(lines.map((l) => Number(l.productId)).filter(Boolean))).map((p) => [p.id, p]));
  const items = lines
    .slice(0, 50)
    .map((l) => {
      const p = l.productId ? products.get(Number(l.productId)) : undefined;
      const qty = Math.min(999, Math.max(1, Math.floor(Number(l.qty) || 1)));
      const price = Math.round(Number(l.price));
      const label = String(l.name ?? "").trim().slice(0, 140) || p?.name || "";
      if (!label || !Number.isFinite(price) || price < 0) return null;
      return {
        product_id: p?.id ?? null,
        product_name: label,
        option_value: String(l.option ?? "").trim().slice(0, 80),
        unit_price: price,
        quantity: qty,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  if (!items.length) errors.lines = "Add at least one item.";
  if (Object.keys(errors).length) return { error: "Please fix the highlighted fields.", fieldErrors: errors };

  const channel = fd.get("channel") === "website" ? "website" : "whatsapp";
  const order = await createOrder({
    channel,
    customer_name: name,
    phone,
    email: str(fd, "email", 120),
    location: str(fd, "location", 200),
    notes: String(fd.get("notes") ?? "").trim().slice(0, 1000),
    items,
  });
  revalidatePath("/admin", "layout");
  redirect(`/admin/orders/${order.id}`);
}

// ---------- Settings ----------

export async function saveSettingsAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const wa = normalizePhone(str(fd, "whatsapp_number", 30));
  if (str(fd, "whatsapp_number", 30) && (wa.length < 10 || wa.length > 15)) {
    return { error: "Check the WhatsApp number.", fieldErrors: { whatsapp_number: "Use international format, e.g. 254712345678." } };
  }
  const values: Record<string, string> = {};
  for (const k of PUBLIC_KEYS) values[k] = k === "whatsapp_number" ? wa : str(fd, k, k === "announcement" || k === "delivery_text" ? 300 : 120);
  await setSettings(values);
  revalidatePath("/", "layout");
  return { ok: "Settings saved." };
}

export async function changePasswordAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  // In a demo, several people may share the admin login; don't let one of them lock the rest out.
  if (isDemo()) return { error: "The password can't be changed on the demo. Change ADMIN_PASSWORD in the hosting settings instead." };
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  const confirm = String(fd.get("confirm") ?? "");
  if (!await checkPassword(current)) return { error: "Your current password isn't right." };
  if (next.length < 10) return { error: "Use at least 10 characters for the new password." };
  if (next !== confirm) return { error: "The new passwords don't match." };
  await changePassword(next);
  // Keep this browser signed in with a fresh session.
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: await isSecureRequest(),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: "Password changed. Other devices have been signed out." };
}
