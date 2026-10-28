export function ksh(amount: number) {
  return "KSh " + Math.round(amount).toLocaleString("en-KE");
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Digits only, Kenyan numbers turned into international form (2547XXXXXXXX). */
export function normalizePhone(input: string) {
  let d = input.replace(/[^\d]/g, "");
  if (d.startsWith("0") && d.length === 10) d = "254" + d.slice(1);
  if ((d.startsWith("7") || d.startsWith("1")) && d.length === 9) d = "254" + d;
  return d;
}

export function displayPhone(input: string) {
  const d = normalizePhone(input);
  if (d.startsWith("254") && d.length === 12) return `+254 ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
  return input;
}

export function waLink(number: string, text?: string) {
  const n = normalizePhone(number);
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function formatDateTime(ms: number) {
  return new Date(ms).toLocaleString("en-KE", {
    timeZone: "Africa/Nairobi",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(ms: number) {
  const s = Math.max(1, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}
