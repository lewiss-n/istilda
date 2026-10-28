import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct } from "@/lib/products";
import { PageHead } from "../../ui";
import { ProductForm } from "../ProductForm";
import { deleteProductAction } from "../../../actions";
import { ConfirmButton } from "../../ConfirmButton";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(Number(id));
  if (!product) notFound();
  return (
    <>
      <Link href="/admin/products" className="mb-3 inline-block text-sm font-semibold text-g7 hover:underline">← All products</Link>
      <PageHead
        title="Edit product"
        sub={product.name}
        action={
          <div className="flex gap-2">
            <Link href={`/product/${product.slug}`} target="_blank" className="btn-outline">View in store</Link>
            <form action={deleteProductAction}>
              <input type="hidden" name="id" value={product.id} />
              <ConfirmButton message={`Delete "${product.name}"? This can't be undone.`} className="btn border-[1.5px] border-danger/30 text-danger hover:bg-red-50">
                Delete
              </ConfirmButton>
            </form>
          </div>
        }
      />
      <ProductForm product={product} />
    </>
  );
}
