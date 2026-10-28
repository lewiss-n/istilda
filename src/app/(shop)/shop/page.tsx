import Link from "next/link";
import type { Metadata } from "next";
import { listProducts, categoryCounts } from "@/lib/products";
import { CATEGORIES, CATEGORY_MAP, TONE_CLASSES } from "@/lib/categories";
import { ProductCard } from "@/components/ProductCard";
import { CategoryIcon } from "@/components/CategoryIcon";
import { IconSearch } from "@/components/Icons";

type SP = Promise<{ category?: string; q?: string; sort?: string }>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const { category } = await searchParams;
  const c = category ? CATEGORY_MAP.get(category) : undefined;
  return { title: c ? c.name : "Shop all" };
}

const SORTS = [
  { v: "", l: "Newest" },
  { v: "price-asc", l: "Price: low to high" },
  { v: "price-desc", l: "Price: high to low" },
  { v: "name", l: "Name A–Z" },
];

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const category = sp.category && CATEGORY_MAP.has(sp.category) ? sp.category : undefined;
  const q = (sp.q ?? "").trim().slice(0, 80);
  const sort = SORTS.some((s) => s.v === sp.sort) ? sp.sort : "";
  const products = await listProducts({ category, q: q || undefined, sort });
  const counts = await categoryCounts();
  const cat = category ? CATEGORY_MAP.get(category)! : null;
  const tone = TONE_CLASSES[cat?.tone ?? "green"];

  const href = (over: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { category, q: q || undefined, sort: sort || undefined, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return `/shop${s ? `?${s}` : ""}`;
  };

  return (
    <div className="container-x pt-6">
      {/* Banner */}
      <div className={`relative overflow-hidden rounded-[28px] px-6 py-10 sm:px-10 sm:py-12 ${tone.bg}`}>
        <div className={`pointer-events-none absolute -right-6 -bottom-10 opacity-90 ${tone.fg}`} aria-hidden="true">
          {cat ? (
            <CategoryIcon slug={cat.slug} className="h-56 w-56 sm:h-72 sm:w-72" strokeWidth={0.9} />
          ) : (
            <div className="flex gap-4 pr-10 pb-16">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-16 w-16 rounded-full border-[10px] border-lime sm:h-20 sm:w-20" />
              ))}
            </div>
          )}
        </div>
        <p className={`kicker ${tone.sub}`}>{cat ? "Category" : "The whole store"}</p>
        <h1 className={`relative mt-2 max-w-2xl font-display text-4xl leading-[0.95] font-extrabold tracking-tight sm:text-6xl ${tone.fg}`}>
          {q ? <>Results for &ldquo;{q}&rdquo;</> : cat ? cat.name : "Shop everything"}
        </h1>
        <p className={`relative mt-3 max-w-lg ${tone.sub}`}>
          {products.length} item{products.length === 1 ? "" : "s"}
          {cat && !q ? ` · ${cat.blurb}` : ""}
        </p>
      </div>

      {/* Category chips */}
      <nav aria-label="Categories" className="-mx-4 mt-6 overflow-x-auto px-4 [scrollbar-width:none]">
        <ul className="flex w-max gap-2">
          <li>
            <Link
              href={href({ category: undefined })}
              className={`flex h-11 items-center rounded-full border-[1.5px] px-4 text-sm font-semibold whitespace-nowrap ${
                !category ? "border-g9 bg-g9 text-white" : "border-line hover:border-g9"
              }`}
            >
              All
            </Link>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Link
                href={href({ category: c.slug })}
                aria-current={category === c.slug ? "page" : undefined}
                className={`flex h-11 items-center gap-2 rounded-full border-[1.5px] pr-4 pl-3 text-sm font-semibold whitespace-nowrap ${
                  category === c.slug ? "border-g9 bg-g9 text-white" : "border-line hover:border-g9"
                }`}
              >
                <CategoryIcon slug={c.slug} className={`h-5 w-5 ${category === c.slug ? "text-lime" : "text-g7"}`} />
                {c.short}
                {counts[c.slug] ? <span className={category === c.slug ? "text-mint" : "text-muted"}>{counts[c.slug]}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Search + sort */}
      <form className="mt-4 flex flex-col gap-3 sm:flex-row" action="/shop" role="search">
        {category && <input type="hidden" name="category" value={category} />}
        <div className="relative flex-1">
          <label htmlFor="shop-q" className="sr-only">Search</label>
          <input id="shop-q" name="q" defaultValue={q} placeholder={cat ? `Search in ${cat.short}` : "Search all products"} className="field h-12 rounded-full pl-11" />
          <IconSearch className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted" />
        </div>
        <label htmlFor="shop-sort" className="sr-only">Sort by</label>
        <select id="shop-sort" name="sort" defaultValue={sort} className="field h-12 rounded-full sm:w-56">
          {SORTS.map((s) => (
            <option key={s.v} value={s.v}>
              {s.l}
            </option>
          ))}
        </select>
        <button className="btn-primary h-12 rounded-full px-6">Apply</button>
      </form>

      {/* Grid */}
      {products.length ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 4} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-[22px] bg-alt px-6 py-16 text-center">
          <p className="font-display text-2xl font-extrabold text-g9">Nothing here yet</p>
          <p className="mx-auto mt-2 max-w-md text-muted">
            {q ? "Try a different search, or browse all categories." : "New stock for this category is on its way. Ask us on WhatsApp if you're looking for something specific."}
          </p>
          <Link href="/shop" className="btn-outline mt-6">
            Browse everything
          </Link>
        </div>
      )}
    </div>
  );
}
