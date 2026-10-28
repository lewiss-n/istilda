import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, listProducts, optionList } from "@/lib/products";
import { getPublicSettings } from "@/lib/settings";
import { CATEGORY_MAP, TONE_CLASSES } from "@/lib/categories";
import { ksh, waLink } from "@/lib/format";
import { imageUrl } from "@/lib/img";
import { Gallery } from "@/components/Gallery";
import { ProductBuy } from "@/components/ProductBuy";
import { ProductCard } from "@/components/ProductCard";
import { IconShield, IconTruck, IconWhatsApp } from "@/components/Icons";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Not found" };
  return {
    title: p.name,
    description: p.description.slice(0, 160) || `${p.name} at Istilda Importers`,
    openGraph: p.images[0] ? { images: [imageUrl(p.images[0])] } : undefined,
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const settings = await getPublicSettings();
  const cat = CATEGORY_MAP.get(product.category);
  const tone = TONE_CLASSES[cat?.tone ?? "mint"];
  const onSale = product.compare_price && product.compare_price > product.price;
  const related = (await listProducts({ category: product.category, limit: 5 })).filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="container-x pt-6">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted">
        <Link href="/shop" className="hover:text-g7">Shop</Link>
        <span className="mx-2">/</span>
        {cat && (
          <>
            <Link href={`/shop?category=${cat.slug}`} className="hover:text-g7">{cat.short}</Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <Gallery images={product.images} name={product.name} category={product.category} toneBg={tone.bg} toneFg={tone.fg} />

        <div className="lg:pt-2">
          {cat && (
            <Link href={`/shop?category=${cat.slug}`} className="badge bg-mint text-g9 hover:bg-lime">
              {cat.name}
            </Link>
          )}
          <h1 className="mt-3 font-display text-3xl leading-[1.05] font-extrabold tracking-tight text-g9 sm:text-[44px]">{product.name}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-extrabold text-g9">{ksh(product.price)}</span>
            {onSale && (
              <>
                <span className="text-lg text-muted line-through">{ksh(product.compare_price!)}</span>
                <span className="badge bg-lime text-g9">Save {ksh(product.compare_price! - product.price)}</span>
              </>
            )}
          </div>

          <ProductBuy
            product={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: product.images[0] ?? null,
              optionLabel: product.option_label,
            }}
            options={optionList(product)}
            inStock={Boolean(product.in_stock)}
          />

          {settings.whatsapp_number && (
            <a
              href={waLink(settings.whatsapp_number, `Hello! I have a question about "${product.name}" (${ksh(product.price)}).`)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 rounded-[10px] py-3 text-[15px] font-semibold text-g7 hover:bg-mint"
            >
              <IconWhatsApp /> Ask a question on WhatsApp
            </a>
          )}

          {product.description && (
            <div className="mt-8 border-t border-line pt-6">
              <h2 className="font-display text-lg font-extrabold text-g9">About this item</h2>
              <div className="mt-3 text-[16px] leading-relaxed whitespace-pre-line text-ink/85">{product.description}</div>
            </div>
          )}

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            <li className="flex items-start gap-3 rounded-[16px] bg-alt p-4">
              <IconShield className="h-6 w-6 shrink-0 text-g7" />
              <span className="text-sm"><b className="block text-g9">Confirm before you pay</b>We check stock and delivery with you first.</span>
            </li>
            <li className="flex items-start gap-3 rounded-[16px] bg-alt p-4">
              <IconTruck className="h-6 w-6 shrink-0 text-g7" />
              <span className="text-sm"><b className="block text-g9">Delivery</b>{settings.delivery_text || "Delivery cost is confirmed with your order."}</span>
            </li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="mb-8 font-display text-3xl font-extrabold tracking-tight text-g9 sm:text-4xl">You might also like</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
