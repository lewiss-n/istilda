import Link from "next/link";
import { listProducts } from "@/lib/products";
import { PageHead } from "../../ui";
import { ManualOrderForm } from "./ManualOrderForm";

export const metadata = { title: "Log an order" };

export default async function NewOrder() {
  const products = (await listProducts({ sort: "name" })).map((p) => ({ id: p.id, name: p.name, price: p.price, options: p.option_values }));
  return (
    <>
      <Link href="/admin/orders" className="mb-3 inline-block text-sm font-semibold text-g7 hover:underline">← All orders</Link>
      <PageHead title="Log an order" sub="For orders that come straight to your WhatsApp or by phone, so every order is on record." />
      <ManualOrderForm products={products} />
    </>
  );
}
