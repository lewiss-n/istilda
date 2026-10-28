import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { countNewOrders } from "@/lib/orders";
import { isDemo } from "@/lib/demo";
import { DemoBanner } from "@/components/DemoBanner";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const newOrders = await countNewOrders();
  return (
    <div className="min-h-screen bg-alt lg:flex">
      <AdminNav newOrders={newOrders} />
      <div className="min-w-0 flex-1">
        {isDemo() && <DemoBanner variant="admin" />}
        <main className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
