export function imageUrl(filename: string, size: "lg" | "sm" = "lg") {
  return `/api/uploads/${size === "sm" ? filename.replace(".webp", "-sm.webp") : filename}`;
}
