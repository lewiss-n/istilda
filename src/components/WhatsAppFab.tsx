"use client";

import { usePathname } from "next/navigation";
import { waLink } from "@/lib/format";
import { IconWhatsApp } from "./Icons";
import { track } from "./track";

export function WhatsAppFab({ number }: { number: string }) {
  const pathname = usePathname();
  if (!number || pathname === "/checkout") return null;
  return (
    <a
      href={waLink(number, "Hello Istilda Importers! I have a question.")}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("whatsapp_click")}
      className="group fixed right-4 bottom-4 z-30 flex items-center gap-2 rounded-full bg-lime py-3 pr-5 pl-4 font-bold text-g9 shadow-[0_10px_30px_-8px_rgba(15,61,46,.55)] ring-2 ring-g9 transition-transform hover:-translate-y-0.5 sm:right-6 sm:bottom-6"
    >
      <IconWhatsApp className="h-6 w-6" />
      <span className="text-[15px]">WhatsApp us</span>
    </a>
  );
}
