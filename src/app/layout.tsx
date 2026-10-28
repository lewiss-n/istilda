import type { Metadata, Viewport } from "next";
import "@fontsource/archivo/600.css";
import "@fontsource/archivo/700.css";
import "@fontsource/archivo/800.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "./globals.css";

export function generateMetadata(): Metadata {
  return {
    title: {
      default: "Istilda Importers | Imported finds, delivered",
      template: "%s | Istilda Importers",
    },
    description:
      "Shop imported wigs, handbags, tote bags, gadgets, cosmetics, perfumes, hats, shoes, sandals, tops and kitchen gadgets. Order online or on WhatsApp.",
    // Keep demo deployments out of search results so they never compete with the real store.
    robots: process.env.DEMO_MODE === "true" ? { index: false, follow: false } : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: "#0f3d2e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
