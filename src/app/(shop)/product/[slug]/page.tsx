import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug, listProducts, optionList, orderName } from "@/lib/products";
import { getPublicSettings } from "@/lib/settings";
import { CATEGORIES, CATEGORY_MAP, DEPARTMENT_MAP, TONE_CLASSES } from "@/lib/categories";
import { ksh, waLink } from "@/lib/format";
import { imageUrl } from "@/lib/img";
import { Gallery } from "@/components/Gallery";
import { ProductBuy } from "@/components/ProductBuy";
import { ProductCard } from "@/components/ProductCard";
import { IconShield, IconTruck, IconWhatsApp } from "@/components/Icons";

type Params = Promise<{ slug: string }>;

function formatDate(ymd: string) {
  return new Date(`${ymd}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Not found" };
  return {
    title: p.name,
    description: p.description.slice(0, 160) || `${[p.brand, orderName(p)].filter(Boolean).join(" ")} at Istilda Importers`,
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
  const dept = cat ? DEPARTMENT_MAP.get(cat.department) : undefined;
  const pantry = dept?.slug === "pantry";
  const facts = [
    { label: "Brand", value: product.brand },
    { label: "Made in", value: product.origin },
    { label: pantry ? "Pack size" : "Size", value: product.pack_size },
    { label: "Best before", value: product.best_before ? formatDate(product.best_before) : "" },
  ].filter((f) => f.value);
  const onSale = product.compare_price && product.compare_price > product.price;
  // Same category first, then the rest of the department.
  let related = (await listProducts({ category: product.category, limit: 5 })).filter((p) => p.id !== product.id);
  if (related.length < 4 && cat) {
    const seen = new Set([product.id, ...related.map((p) => p.id)]);
    const more = await listProducts({ categories: CATEGORIES.filter((c) => c.department === cat.department).map((c) => c.slug), limit: 12 });
    related = [...related, ...more.filter((p) => !seen.has(p.id))];
  }
  related = related.slice(0, 4);

  return (
    <div className="container-x pt-6">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted">
        <Link href="/shop" className="hover:text-g7">Shop</Link>
        <span className="mx-2">/</span>
        {dept && (
          <>
            <Link href={`/${dept.slug}`} className="hover:text-g7">{dept.name}</Link>
            <span className="mx-2">/</span>
          </>
        )}
        {cat && (
          <>
            <Link href={`/${cat.department}?category=${cat.slug}`} className="hover:text-g7">{cat.short}</Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <Gallery images={product.images} name={product.name} category={product.category} toneBg={tone.bg} toneFg={tone.fg} packshot={pantry} />

        <div className="lg:pt-2">
          <div className="flex flex-wrap gap-2">
            {pantry && (
              <Link href="/pantry" className="badge bg-spice text-cream hover:bg-spice-dark">
                Istilda Pantry
              </Link>
            )}
            {cat && (
              <Link href={`/${cat.department}?category=${cat.slug}`} className={`badge ${pantry ? "bg-cream text-cocoa hover:bg-cream-dark" : "bg-mint text-g9 hover:bg-lime"}`}>
                {cat.name}
              </Link>
            )}
          </div>
          {product.brand && <p className={`mt-4 text-sm font-bold tracking-wide uppercase ${pantry ? "text-spice" : "text-g7"}`}>{product.brand}</p>}
          <h1 className={`${product.brand ? "mt-1" : "mt-3"} font-display text-3xl leading-[1.05] font-extrabold tracking-tight text-g9 sm:text-[44px]`}>{product.name}</h1>
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-3xl font-extrabold text-g9">{ksh(product.price)}</span>
            {product.pack_size && <span className="text-lg font-semibold text-muted">{product.pack_size}</span>}
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
              name: orderName(product),
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

          {product.allergens && (
            <div className="mt-6 flex gap-3 rounded-[16px] border-[1.5px] border-saffron bg-cream p-4" role="note">
              <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-spice" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 3 2.5 20h19z" />
                <path d="M12 10v4.5M12 17.2v.3" />
              </svg>
              <p className="text-[15px] text-cocoa">
                <b className="block">Allergy information</b>
                {product.allergens}
              </p>
            </div>
          )}

          {facts.length > 0 && (
            <div className="mt-8 border-t border-line pt-6">
              <h2 className="font-display text-lg font-extrabold text-g9">Good to know</h2>
              <dl className="mt-3 grid grid-cols-2 gap-3">
                {facts.map((f) => (
                  <div key={f.label} className={`rounded-[14px] p-3.5 ${pantry ? "bg-cream" : "bg-alt"}`}>
                    <dt className="text-[12px] font-semibold tracking-wide text-muted uppercase">{f.label}</dt>
                    <dd className="mt-0.5 font-semibold text-ink">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
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
          <h2 className="mb-8 font-display text-3xl font-extrabold tracking-tight text-g9 sm:text-4xl">{pantry ? "More from the Pantry" : "You might also like"}</h2>
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
