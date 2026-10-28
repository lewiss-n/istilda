import Link from "next/link";
import { PageHead } from "../../ui";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "Add product" };

export default function NewProduct() {
  return (
    <>
      <Link href="/admin/products" className="mb-3 inline-block text-sm font-semibold text-g7 hover:underline">← All products</Link>
      <PageHead title="Add product" sub="Fill in the details and add photos. It goes live as soon as you save." />
      <ProductForm />
    </>
  );
}
