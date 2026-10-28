import Link from "next/link";
import { Logo } from "./Logo";
import { CATEGORIES } from "@/lib/categories";
import type { PublicSettings } from "@/lib/settings";
import { displayPhone, waLink } from "@/lib/format";

export function Footer({ settings }: { settings: PublicSettings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-24 overflow-hidden bg-g9 text-mint">
      <svg className="pointer-events-none absolute -top-44 -right-44 h-80 w-80 text-g7" viewBox="0 0 200 200" aria-hidden="true">
        <rect width="200" height="200" rx="44" fill="currentColor" />
      </svg>
      <div className="container-x relative grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Logo variant="dark" size="lg" />
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed">
            Imported finds for your hair, wardrobe, home and everyday tech. Send an order request online or on WhatsApp and we&apos;ll confirm the details with you.
          </p>
          {settings.whatsapp_number && (
            <a href={waLink(settings.whatsapp_number, "Hello Istilda Importers!")} target="_blank" rel="noopener noreferrer" className="btn-lime mt-6">
              Chat with us on WhatsApp
            </a>
          )}
        </div>
        <div>
          <h2 className="kicker mb-4 text-lime">Shop</h2>
          <ul className="grid grid-cols-1 gap-2 text-[15px]">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className="hover:text-lime">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="kicker mb-4 text-lime">Contact</h2>
          <ul className="space-y-2 text-[15px]">
            {settings.contact_phone && (
              <li>
                <a href={`tel:+${settings.contact_phone.replace(/[^\d]/g, "")}`} className="hover:text-lime">
                  {displayPhone(settings.contact_phone)}
                </a>
              </li>
            )}
            {settings.contact_email && (
              <li>
                <a href={`mailto:${settings.contact_email}`} className="hover:text-lime">
                  {settings.contact_email}
                </a>
              </li>
            )}
            {settings.instagram && (
              <li>
                <a href={`https://instagram.com/${settings.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-lime">
                  Instagram: @{settings.instagram.replace(/^@/, "")}
                </a>
              </li>
            )}
            {settings.location_text && <li>{settings.location_text}</li>}
          </ul>
          {settings.delivery_text && (
            <>
              <h2 className="kicker mt-8 mb-3 text-lime">Delivery</h2>
              <p className="text-[15px] leading-relaxed">{settings.delivery_text}</p>
            </>
          )}
        </div>
      </div>
      <div className="relative border-t border-g7">
        <div className="container-x flex flex-col gap-2 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} Istilda Importers</span>
          <Link href="/how-to-order" className="hover:text-lime">How ordering works</Link>
        </div>
      </div>
    </footer>
  );
}
