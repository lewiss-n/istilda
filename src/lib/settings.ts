import "server-only";
import { one, query } from "./db";

export type PublicSettings = {
  whatsapp_number: string;
  contact_phone: string;
  contact_email: string;
  instagram: string;
  location_text: string;
  announcement: string;
  delivery_text: string;
};

export const PUBLIC_KEYS: (keyof PublicSettings)[] = [
  "whatsapp_number",
  "contact_phone",
  "contact_email",
  "instagram",
  "location_text",
  "announcement",
  "delivery_text",
];

export async function getSetting(key: string): Promise<string> {
  const row = await one<{ value: string }>("SELECT value FROM settings WHERE key = $1", [key]);
  return row?.value ?? "";
}

export async function setSettings(values: Record<string, string>) {
  const keys = Object.keys(values);
  if (!keys.length) return;
  await query(
    `INSERT INTO settings (key, value) SELECT * FROM unnest($1::text[], $2::text[])
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [keys, keys.map((k) => values[k])],
  );
}

export async function getPublicSettings(): Promise<PublicSettings> {
  const rows = await query<{ key: string; value: string }>("SELECT key, value FROM settings WHERE key = ANY($1)", [PUBLIC_KEYS]);
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const out = {} as PublicSettings;
  for (const k of PUBLIC_KEYS) out[k] = map.get(k) ?? "";
  // Environment variable is a fallback until the owner saves a number in Settings.
  if (!out.whatsapp_number && process.env.WHATSAPP_NUMBER) out.whatsapp_number = process.env.WHATSAPP_NUMBER;
  return out;
}
