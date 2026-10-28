import Link from "next/link";
import type { Product } from "@/lib/products";
import { optionList } from "@/lib/products";
import { ksh } from "@/lib/format";
import { imageUrl } from "@/lib/img";
import { categoryName, CATEGORY_MAP, TONE_CLASSES } from "@/lib/categories";
import { CategoryIcon } from "./CategoryIcon";
import { QuickAdd } from "./QuickAdd";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const cover = product.images[0];
  const second = product.images[1];
  const onSale = product.compare_price && product.compare_price > product.price;
  const tone = TONE_CLASSES[CATEGORY_MAP.get(product.category)?.tone ?? "mint"];
  const hasOptions = optionList(product).length > 0;

  return (
    <article className="group relative flex flex-col">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden rounded-[18px] bg-alt">
        {cover ? (
          <>
            <img
              src={imageUrl(cover, "sm")}
              alt={product.name}
              loading={priority ? "eager" : "lazy"}
              className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.04] ${second ? "group-hover:opacity-0" : ""}`}
            />
            {second && (
              <img src={imageUrl(second, "sm")} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 group-hover:opacity-100" />
            )}
          </>
        ) : (
          <div className={`grid h-full w-full place-items-center ${tone.bg} ${tone.fg}`}>
            <CategoryIcon slug={product.category} className="h-1/3 w-1/3" strokeWidth={1.2} />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {!product.in_stock ? (
            <span className="badge bg-white text-ink">Sold out</span>
          ) : onSale ? (
            <span className="badge bg-g9 text-lime">Sale</span>
          ) : product.featured ? (
            <span className="badge bg-lime text-g9">Top pick</span>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 items-start gap-2 pt-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold tracking-wide text-muted uppercase">{categoryName(product.category).split(",")[0]}</p>
          <h3 className="mt-0.5 line-clamp-2 font-semibold leading-snug">
            <Link href={`/product/${product.slug}`} className="hover:text-g7">
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2 whitespace-nowrap">
            <span className="font-display text-[17px] font-bold text-g9">{ksh(product.price)}</span>
            {onSale && <span className="text-sm text-muted line-through">{ksh(product.compare_price!)}</span>}
          </p>
        </div>
        {product.in_stock ? (
          <QuickAdd
            item={{
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: cover ?? null,
              option: "",
              optionLabel: product.option_label,
            }}
            needsOption={hasOptions}
          />
        ) : null}
      </div>
    </article>
  );
}
