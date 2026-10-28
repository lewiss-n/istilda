"use client";

import { useEffect, useState } from "react";
import { IconWhatsApp } from "../Icons";

export function OpenWhatsApp({ orderRef }: { orderRef: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let u: string | null = null;
    try {
      u = sessionStorage.getItem(`ist-wa-${orderRef}`);
    } catch {}
    setUrl(u);
    if (!u) return;
    const opened = sessionStorage.getItem(`ist-wa-opened-${orderRef}`);
    if (opened) return;
    sessionStorage.setItem(`ist-wa-opened-${orderRef}`, "1");
    const t = setTimeout(() => window.location.assign(u!), 700);
    return () => clearTimeout(t);
  }, [orderRef]);

  if (!url) return null;
  return (
    <div className="mt-6">
      <a href={url} className="btn-lime h-[52px] px-7 text-base">
        <IconWhatsApp /> Open WhatsApp
      </a>
      <p className="mt-2 text-sm text-mint/80">WhatsApp didn&apos;t open? Tap the button.</p>
    </div>
  );
}
