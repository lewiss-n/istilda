import Link from "next/link";
import { listProducts } from "@/lib/products";
import { CATEGORIES, DEPARTMENTS, DEPARTMENT_MAP, categoriesIn, categoryName, type DepartmentSlug } from "@/lib/categories";
import { ksh } from "@/lib/format";
import { imageUrl } from "@/lib/img";
import { CategoryIcon } from "@/components/CategoryIcon";
import { IconPlus, IconSearch } from "@/components/Icons";
import { toggleStockAction } from "../../actions";
import { Card, Flash, PageHead } from "../ui";

export const metadata = { title: "Products" };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; saved?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  // The filter takes a category slug, or "dept:<department>" for a whole department.
  const dept = sp.category?.startsWith("dept:") ? DEPARTMENT_MAP.get(sp.category.slice(5) as DepartmentSlug) : undefined;
  const category = CATEGORIES.some((c) => c.slug === sp.category) ? sp.category : undefined;
  const products = await listProducts({
    q: q || undefined,
    category,
    categories: dept ? categoriesIn(dept.slug).map((c) => c.slug) : undefined,
  });
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const expired = products.filter((p) => p.best_before && p.best_before < today && p.in_stock).length;

  return (
    <>
      <PageHead
        title="Products"
        sub={`${products.length} product${products.length === 1 ? "" : "s"}${category ? ` in ${categoryName(category)}` : dept ? ` in ${dept.name}` : ""}`}
        action={
          <Link href={`/admin/products/new${category ? `?category=${category}` : ""}`} className="btn-primary">
            <IconPlus /> Add product
          </Link>
        }
      />
      {sp.saved && <Flash>Saved “{sp.saved}”. It&apos;s live on the store.</Flash>}
      {sp.deleted && <Flash>Product deleted.</Flash>}
      {expired > 0 && (
        <p className="mb-5 rounded-[14px] bg-red-50 px-4 py-3 text-sm font-semibold text-danger" role="status">
          {expired} product{expired === 1 ? " is" : "s are"} past {expired === 1 ? "its" : "their"} best-before date but still shown as in stock. Update the date for new stock, or mark {expired === 1 ? "it" : "them"} sold out.
        </p>
      )}

      <form className="mb-5 flex flex-col gap-3 sm:flex-row" role="search">
        <div className="relative flex-1">
          <label htmlFor="pq" className="sr-only">Search products</label>
          <input id="pq" name="q" defaultValue={q} placeholder="Search by name, brand or description" className="field pl-10" />
          <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
        </div>
        <label htmlFor="pc" className="sr-only">Category</label>
        <select id="pc" name="category" defaultValue={sp.category && (category || dept) ? sp.category : ""} className="field sm:w-64">
          <option value="">All categories</option>
          {DEPARTMENTS.map((d) => (
            <optgroup key={d.slug} label={d.name}>
              <option value={`dept:${d.slug}`}>All of {d.name}</option>
              {categoriesIn(d.slug).map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <button className="btn-outline">Filter</button>
      </form>

      {products.length === 0 ? (
        <Card className="py-14 text-center">
          <p className="font-display text-2xl font-extrabold text-g9">{q || category ? "No products match" : "No products yet"}</p>
          <p className="mt-1 text-muted">{q || category ? "Try another search or category." : "Add your first product and it will appear in the shop straight away."}</p>
          <Link href="/admin/products/new" className="btn-primary mt-6">
            <IconPlus /> Add product
          </Link>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0 sm:p-0">
          <ul className="divide-y divide-line">
            {products.map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-4 py-3 sm:px-5">
                <Link href={`/admin/products/${p.id}`} className="h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-mint">
                  {p.images[0] ? (
                    <img src={imageUrl(p.images[0], "sm")} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-g7"><CategoryIcon slug={p.category} className="h-7 w-7" /></span>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/products/${p.id}`} className="block truncate font-semibold hover:text-g7">{p.name}</Link>
                  <p className="truncate text-sm text-muted">
                    {[p.brand, p.pack_size].filter(Boolean).join(" · ")}
                    {p.brand || p.pack_size ? " · " : ""}
                    {categoryName(p.category)} · {p.images.length} photo{p.images.length === 1 ? "" : "s"}
                    {p.featured ? " · Top pick" : ""}
                  </p>
                  {p.best_before && p.best_before < soon && (
                    <p className={`mt-0.5 text-xs font-bold ${p.best_before < today ? "text-danger" : "text-spice"}`}>
                      {p.best_before < today ? "Past best-before" : "Best before"} {p.best_before}
                    </p>
                  )}
                </div>
                <div className="hidden text-right sm:block">
                  <p className="font-display font-bold text-g9">{ksh(p.price)}</p>
                  {p.compare_price ? <p className="text-xs text-muted line-through">{ksh(p.compare_price)}</p> : null}
                </div>
                <form action={toggleStockAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    title="Click to switch"
                    className={`badge min-w-[84px] justify-center py-1.5 ${p.in_stock ? "bg-mint text-g9 hover:bg-lime" : "bg-red-50 text-danger hover:bg-red-100"}`}
                  >
                    {p.in_stock ? "In stock" : "Sold out"}
                  </button>
                </form>
                <Link href={`/admin/products/${p.id}`} className="hidden rounded-[10px] px-3 py-2 text-sm font-bold text-g7 hover:bg-mint md:block">
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
