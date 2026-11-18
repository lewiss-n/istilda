import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { brandCounts, categoryCounts, listProducts } from "@/lib/products";
import { CATEGORY_MAP, DEPARTMENT_MAP, categoriesIn, type DepartmentSlug } from "@/lib/categories";
import { ProductCard } from "@/components/ProductCard";
import { CategoryIcon } from "@/components/CategoryIcon";

type Params = Promise<{ department: string }>;
type SP = Promise<{ category?: string; brand?: string; sort?: string }>;

const SORTS = [
  { v: "", l: "Newest" },
  { v: "price-asc", l: "Price: low to high" },
  { v: "price-desc", l: "Price: high to low" },
  { v: "name", l: "Name A–Z" },
];

function getDepartment(slug: string) {
  return DEPARTMENT_MAP.get(slug as DepartmentSlug);
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const d = getDepartment((await params).department);
  if (!d) return { title: "Not found" };
  return { title: d.name, description: d.intro };
}

export default async function DepartmentPage({ params, searchParams }: { params: Params; searchParams: SP }) {
  const dept = getDepartment((await params).department);
  if (!dept) notFound();
  const sp = await searchParams;
  const cats = categoriesIn(dept.slug);
  const slugs = cats.map((c) => c.slug);
  const category = sp.category && slugs.includes(sp.category) ? sp.category : undefined;
  const sort = SORTS.some((s) => s.v === sp.sort) ? sp.sort : "";

  const [counts, brands] = await Promise.all([categoryCounts(), brandCounts(category ? [category] : slugs)]);
  const brand = brands.find((b) => b.brand.toLowerCase() === sp.brand?.toLowerCase())?.brand;
  const products = await listProducts({ categories: category ? [category] : slugs, brand, sort });
  const total = slugs.reduce((n, s) => n + (counts[s] ?? 0), 0);
  const pantry = dept.theme === "pantry";
  const cat = category ? CATEGORY_MAP.get(category) : undefined;

  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { category, brand, sort: sort || undefined, ...over };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/${dept.slug}${s ? `?${s}` : ""}`;
  };

  const chip = (active: boolean) =>
    `flex h-11 items-center gap-2 rounded-full border-[1.5px] px-4 text-sm font-semibold whitespace-nowrap transition-colors ${
      active
        ? pantry
          ? "border-spice bg-spice text-cream"
          : "border-g9 bg-g9 text-white"
        : pantry
          ? "border-cream-dark bg-white hover:border-spice"
          : "border-line hover:border-g9"
    }`;

  return (
    <div className="container-x pt-6">
      {/* ---------- Banner ---------- */}
      <section className={`relative overflow-hidden rounded-[28px] px-6 py-10 sm:px-10 sm:py-14 ${pantry ? "bg-spice text-cream" : "bg-g9 text-white"}`}>
        {pantry ? (
          <div className="pointer-events-none absolute -right-8 -bottom-12 hidden gap-3 sm:flex" aria-hidden="true">
            {cats.map((c, i) => (
              <span
                key={c.slug}
                className={`grid h-28 w-28 place-items-center rounded-full lg:h-36 lg:w-36 ${["bg-saffron text-cocoa", "bg-cream text-spice", "bg-spice-dark text-saffron", "bg-saffron text-cocoa"][i % 4]}`}
                style={{ transform: `translateY(${i % 2 ? -28 : 0}px)` }}
              >
                <CategoryIcon slug={c.slug} className="h-14 w-14 lg:h-16 lg:w-16" strokeWidth={1.3} />
              </span>
            ))}
          </div>
        ) : (
          <div className="pointer-events-none absolute -right-6 -bottom-10 flex gap-3 text-g7 opacity-90" aria-hidden="true">
            {cats.slice(0, 3).map((c) => (
              <CategoryIcon key={c.slug} slug={c.slug} className="h-40 w-40 sm:h-52 sm:w-52" strokeWidth={0.9} />
            ))}
          </div>
        )}
        <div className="relative max-w-xl">
          <p className={`kicker flex items-center gap-2 ${pantry ? "text-saffron" : "text-lime"}`}>
            <span className={`inline-block h-2 w-2 rounded-full ${pantry ? "bg-saffron" : "bg-lime"}`} />
            {pantry ? "New at Istilda" : "Department"}
          </p>
          <h1 className="mt-3 font-display text-[44px] leading-[0.95] font-extrabold tracking-[-0.03em] sm:text-6xl lg:text-7xl">{dept.name}</h1>
          <p className={`mt-4 text-[17px] leading-relaxed ${pantry ? "text-cream/90" : "text-mint"}`}>{dept.intro}</p>
          <p className={`mt-4 text-sm font-semibold ${pantry ? "text-saffron" : "text-lime"}`}>
            {total} item{total === 1 ? "" : "s"} · {cats.map((c) => c.short).join(", ")}
          </p>
        </div>
      </section>

      {/* ---------- Pantry promises ---------- */}
      {pantry && (
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { t: "Brands we trust", d: "Sealed, branded packs, sold exactly as they leave the maker." },
            { t: "Best-before shown", d: "We list the best-before date for the stock we have now." },
            { t: "Allergy info up front", d: "Nuts and other allergens are flagged on the product page." },
          ].map((x) => (
            <li key={x.t} className="rounded-[18px] bg-cream p-3 sm:p-4">
              <p className="font-display text-[14px] leading-tight font-extrabold text-cocoa sm:text-base">{x.t}</p>
              <p className="mt-0.5 hidden text-sm text-cocoa/75 sm:block">{x.d}</p>
            </li>
          ))}
        </ul>
      )}

      {/* ---------- Categories ---------- */}
      <nav aria-label={`${dept.name} categories`} className="mt-8">
        <div className={`grid gap-3 ${cats.length === 2 ? "grid-cols-2" : cats.length === 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"} ${cats.length > 4 ? "lg:grid-cols-7" : ""}`}>
          {cats.map((c) => {
            const active = category === c.slug;
            const n = counts[c.slug] ?? 0;
            return (
              <Link
                key={c.slug}
                href={href({ category: active ? undefined : c.slug, brand: undefined })}
                aria-current={active ? "page" : undefined}
                className={`group flex flex-col gap-3 rounded-[20px] p-4 transition-all hover:-translate-y-0.5 ${
                  active
                    ? pantry
                      ? "bg-spice text-cream ring-2 ring-saffron"
                      : "bg-g9 text-white ring-2 ring-lime"
                    : pantry
                      ? "bg-cream text-cocoa hover:bg-cream-dark"
                      : "bg-alt text-g9 hover:bg-mint"
                }`}
              >
                <CategoryIcon slug={c.slug} className={`h-9 w-9 ${active ? (pantry ? "text-saffron" : "text-lime") : pantry ? "text-spice" : "text-g7"}`} strokeWidth={1.5} />
                <span>
                  <span className="block font-display text-[17px] leading-tight font-extrabold">{c.short}</span>
                  <span className={`text-[13px] ${active ? "opacity-80" : "text-muted"}`}>{n ? `${n} item${n === 1 ? "" : "s"}` : "Coming soon"}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ---------- Brand filter + sort ---------- */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        {brands.length > 0 ? (
          <nav aria-label="Brands" className="-mx-4 flex-1 overflow-x-auto px-4 [scrollbar-width:none]">
            <ul className="flex w-max items-center gap-2">
              <li className="mr-1 text-sm font-bold text-muted">Brand</li>
              <li>
                <Link href={href({ brand: undefined })} className={chip(!brand)}>
                  All
                </Link>
              </li>
              {brands.map((b) => (
                <li key={b.brand}>
                  <Link href={href({ brand: brand === b.brand ? undefined : b.brand })} aria-current={brand === b.brand ? "page" : undefined} className={chip(brand === b.brand)}>
                    {b.brand}
                    <span className={brand === b.brand ? "opacity-75" : "text-muted"}>{b.n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <div className="flex-1" />
        )}
        <form action={`/${dept.slug}`} className="flex gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          {brand && <input type="hidden" name="brand" value={brand} />}
          <label htmlFor="dept-sort" className="sr-only">Sort by</label>
          <select id="dept-sort" name="sort" defaultValue={sort} className="field h-11 rounded-full sm:w-56">
            {SORTS.map((s) => (
              <option key={s.v} value={s.v}>
                {s.l}
              </option>
            ))}
          </select>
          <button className={`btn h-11 rounded-full px-5 ${pantry ? "bg-spice text-cream hover:bg-spice-dark" : "bg-g9 text-white hover:bg-g7"}`}>Sort</button>
        </form>
      </div>

      {/* ---------- Products ---------- */}
      <h2 className="sr-only">Products</h2>
      {products.length ? (
        <>
          <p className="mt-6 text-sm text-muted">
            {products.length} item{products.length === 1 ? "" : "s"}
            {cat ? ` in ${cat.name}` : ""}
            {brand ? ` from ${brand}` : ""}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        </>
      ) : (
        <div className={`mt-8 rounded-[22px] px-6 py-16 text-center ${pantry ? "bg-cream" : "bg-alt"}`}>
          <p className={`font-display text-2xl font-extrabold ${pantry ? "text-cocoa" : "text-g9"}`}>
            {pantry ? "The shelves are being stocked" : "New stock is on its way"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-muted">
            {cat ? `We're bringing in ${cat.short.toLowerCase()} now.` : `We're bringing in new ${dept.name} stock now.`} Ask us on WhatsApp if you&apos;re looking for something specific.
          </p>
          <Link href="/shop" className="btn-outline mt-6">
            Browse the whole store
          </Link>
        </div>
      )}
    </div>
  );
}
