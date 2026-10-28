import { getPublicSettings } from "@/lib/settings";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Tracker } from "@/components/Tracker";
import { WhatsAppFab } from "@/components/WhatsAppFab";
import { DemoBanner } from "@/components/DemoBanner";
import { isDemo } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();
  return (
    <CartProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-lime focus:px-4 focus:py-2 focus:font-bold focus:text-g9">
        Skip to content
      </a>
      {isDemo() && <DemoBanner />}
      <Header announcement={settings.announcement} />
      <main id="main">{children}</main>
      <Footer settings={settings} />
      <CartDrawer />
      <WhatsAppFab number={settings.whatsapp_number} />
      <Tracker />
    </CartProvider>
  );
}
