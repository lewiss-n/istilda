"use client";

export function track(type: "pageview" | "add_to_cart" | "whatsapp_click", data: { path?: string; referrer?: string; productId?: number } = {}) {
  try {
    const body = JSON.stringify({ type, path: data.path ?? window.location.pathname, ...data });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "text/plain" }));
    } else {
      fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
    }
  } catch {
    // analytics must never break the shop
  }
}
