import Link from "next/link";
import { brandCounts } from "@/lib/products";
import { CATEGORY_MAP } from "@/lib/categories";
import { PageHead } from "../../ui";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "Add product" };

export default async function NewProduct({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const brands = (await brandCounts()).map((b) => b.brand);
  return (
    <>
      <Link href="/admin/products" className="mb-3 inline-block text-sm font-semibold text-g7 hover:underline">← All products</Link>
      <PageHead title="Add product" sub="Fill in the details and add photos. It goes live as soon as you save." />
      <ProductForm brands={brands} defaultCategory={category && CATEGORY_MAP.has(category) ? category : undefined} />
    </>
  );
}
