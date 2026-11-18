import Link from "next/link";
import { listProducts, categoryCounts } from "@/lib/products";
import { getPublicSettings } from "@/lib/settings";
import { CATEGORIES, DEPARTMENTS, categoriesIn, type DepartmentSlug } from "@/lib/categories";
import { imageUrl } from "@/lib/img";
import { waLink } from "@/lib/format";
import { ProductCard } from "@/components/ProductCard";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CartMark } from "@/components/Logo";
import { IconArrow, IconChat, IconShield, IconBox, IconWhatsApp } from "@/components/Icons";

export default async function HomePage() {
  const settings = await getPublicSettings();
  const latest = await listProducts({ limit: 8 });
  const featured = await listProducts({ featured: true, limit: 4 });
  const counts = await categoryCounts();
  const heroImages = [...featured, ...latest].filter((p) => p.images.length).slice(0, 3);
  const pantrySlugs = categoriesIn("pantry").map((c) => c.slug);
  const pantryProducts = await listProducts({ categories: pantrySlugs, limit: 4 });
  const deptCount = (d: DepartmentSlug) => categoriesIn(d).reduce((n, c) => n + (counts[c.slug] ?? 0), 0);
  // Card colours for each department on the home page.
  const DEPT_STYLE: Record<DepartmentSlug, { card: string; title: string; sub: string; icon: string; pill: string }> = {
    style: { card: "bg-g9", title: "text-lime", sub: "text-mint", icon: "text-lime", pill: "bg-g7 text-white hover:bg-lime hover:text-g9" },
    beauty: { card: "bg-lime", title: "text-g9", sub: "text-g9/75", icon: "text-g9", pill: "bg-white/70 text-g9 hover:bg-g9 hover:text-lime" },
    "home-gadgets": { card: "bg-mint", title: "text-g9", sub: "text-g7", icon: "text-g7", pill: "bg-white text-g9 hover:bg-g9 hover:text-white" },
    pantry: { card: "bg-spice", title: "text-cream", sub: "text-cream/80", icon: "text-saffron", pill: "bg-spice-dark text-cream hover:bg-saffron hover:text-cocoa" },
  };

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="container-x pt-4 sm:pt-6">
        <div className="relative overflow-hidden rounded-[28px] bg-g9 text-white sm:rounded-[36px]">
          <svg className="pointer-events-none absolute -right-20 -bottom-28 h-[420px] w-[420px] text-g7 lg:hidden" viewBox="0 0 100 100" aria-hidden="true">
            <rect width="100" height="100" rx="22" fill="currentColor" />
          </svg>
          <div className="relative grid items-center gap-10 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:gap-6 lg:px-14 lg:py-20">
            <div className="animate-rise">
              <p className="kicker flex items-center gap-2 text-lime">
                <span className="inline-block h-2 w-2 rounded-full bg-lime" /> Imported · Hand-picked · Delivered
              </p>
              <h1 className="mt-5 font-display text-[44px] leading-[0.95] font-extrabold tracking-[-0.035em] sm:text-[64px] lg:text-[76px]">
                Imported finds,
                <br />
                <span className="relative inline-block text-lime">
                  delivered
                  <svg className="absolute -bottom-2 left-0 w-full text-lime" viewBox="0 0 300 12" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M2 9C60 3 150 2 298 7" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                  </svg>
                </span>{" "}
                to you.
              </h1>
              <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-mint sm:text-lg">
                Style, beauty, home gadgets and now the Istilda Pantry. Pick what you love, send an order request in a minute, and we&apos;ll confirm everything with you before you pay.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/shop" className="btn-lime h-[52px] px-7 text-base">
                  Shop the collection <IconArrow />
                </Link>
                {settings.whatsapp_number && (
                  <a href={waLink(settings.whatsapp_number, "Hello Istilda Importers! I'd like to order.")} target="_blank" rel="noopener noreferrer" className="btn-ghost-light h-[52px] px-6 text-base">
                    <IconWhatsApp /> Order on WhatsApp
                  </a>
                )}
              </div>
              <dl className="mt-10 hidden max-w-md grid-cols-3 gap-4 border-t border-g7 pt-6 sm:grid">
                <div>
                  <dt className="text-[13px] text-mint/80">Departments</dt>
                  <dd className="font-display text-2xl font-extrabold text-lime">{DEPARTMENTS.length}</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-mint/80">Order via</dt>
                  <dd className="font-display text-lg leading-tight font-bold">Web or WhatsApp</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-mint/80">You pay</dt>
                  <dd className="font-display text-lg leading-tight font-bold">After we confirm</dd>
                </div>
              </dl>
            </div>

            {/* Collage */}
            <div className="relative hidden h-[460px] lg:block" aria-hidden={heroImages.length === 0}>
              {heroImages.length >= 2 ? (
                <>
                  <Link href={`/product/${heroImages[0].slug}`} className="absolute top-0 right-10 h-[300px] w-[260px] overflow-hidden rounded-[28px] bg-g7 ring-8 ring-g9 transition-transform hover:-rotate-1">
                    <img src={imageUrl(heroImages[0].images[0])} alt={heroImages[0].name} className="h-full w-full object-cover" />
                  </Link>
                  <Link href={`/product/${heroImages[1].slug}`} className="absolute bottom-0 left-4 h-[240px] w-[220px] overflow-hidden rounded-[28px] bg-g7 ring-8 ring-g9 transition-transform hover:rotate-1">
                    <img src={imageUrl(heroImages[1].images[0], "sm")} alt={heroImages[1].name} className="h-full w-full object-cover" />
                  </Link>
                  {heroImages[2] ? (
                    <Link href={`/product/${heroImages[2].slug}`} className="absolute right-0 bottom-6 h-[150px] w-[150px] overflow-hidden rounded-[24px] bg-g7 ring-8 ring-g9">
                      <img src={imageUrl(heroImages[2].images[0], "sm")} alt={heroImages[2].name} className="h-full w-full object-cover" />
                    </Link>
                  ) : (
                    <div className="absolute right-0 bottom-6 grid h-[150px] w-[150px] place-items-center rounded-[24px] bg-lime text-g9">
                      <CartMark className="h-24 w-24" />
                    </div>
                  )}
                  <div className="absolute top-16 left-0 grid h-[120px] w-[120px] place-items-center rounded-[24px] bg-lime text-g9">
                    <CartMark className="h-20 w-20" />
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute top-0 right-6 grid h-[290px] w-[290px] place-items-center rounded-[40px] bg-lime text-g9">
                    <CartMark className="h-48 w-48" />
                  </div>
                  <div className="absolute bottom-4 left-6 grid h-[170px] w-[170px] place-items-center rounded-[32px] bg-mint text-g9">
                    <CategoryIcon slug="handbags" className="h-24 w-24" strokeWidth={1.1} />
                  </div>
                  <div className="absolute right-0 bottom-0 grid h-[150px] w-[150px] place-items-center rounded-[30px] bg-g7 text-lime">
                    <CategoryIcon slug="perfumes" className="h-20 w-20" strokeWidth={1.1} />
                  </div>
                  <div className="absolute top-14 left-0 flex gap-3">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-10 w-10 rounded-full border-[6px] border-lime" />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Marquee ---------- */}
      <section className="mt-8 overflow-hidden border-y-2 border-g9 bg-lime py-3.5" aria-label="Categories we stock">
        <div className="flex w-max animate-marquee gap-10 pr-10">
          {[...CATEGORIES, ...CATEGORIES].map((c, i) => (
            <span key={i} className="flex items-center gap-10 font-display text-xl font-extrabold whitespace-nowrap text-g9 sm:text-2xl">
              {c.name}
              <span className="h-5 w-5 rounded-full border-[5px] border-g9" aria-hidden="true" />
            </span>
          ))}
        </div>
      </section>

      {/* ---------- Departments ---------- */}
      <section className="container-x mt-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker text-g7">Browse</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-g9 sm:text-5xl">Shop by department</h2>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-1.5 font-bold text-g7 hover:underline">
            See everything <IconArrow className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {DEPARTMENTS.map((d) => {
            const st = DEPT_STYLE[d.slug];
            const cats = categoriesIn(d.slug);
            const n = deptCount(d.slug);
            return (
              <div key={d.slug} className={`group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[26px] p-6 sm:p-8 ${st.card}`}>
                <div className={`pointer-events-none absolute top-5 right-5 flex gap-2 opacity-90 sm:top-6 sm:right-6 ${st.icon}`} aria-hidden="true">
                  {cats.slice(0, 3).map((c) => (
                    <CategoryIcon key={c.slug} slug={c.slug} className="h-12 w-12 sm:h-16 sm:w-16" strokeWidth={1.2} />
                  ))}
                </div>
                <Link href={`/${d.slug}`} className="relative mt-16 block after:absolute after:inset-0 after:content-[''] sm:mt-20">
                  {d.theme === "pantry" && <span className="badge mb-3 bg-saffron text-cocoa">New</span>}
                  <span className={`block font-display text-4xl leading-none font-extrabold tracking-tight sm:text-5xl ${st.title}`}>{d.name}</span>
                  <span className={`mt-2 block font-medium ${st.sub}`}>
                    {d.tagline}
                    {n ? ` · ${n} item${n === 1 ? "" : "s"}` : ""}
                  </span>
                </Link>
                <ul className="relative z-10 mt-5 flex flex-wrap gap-2">
                  {cats.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/${d.slug}?category=${c.slug}`} className={`inline-flex h-9 items-center rounded-full px-3.5 text-sm font-semibold transition-colors ${st.pill}`}>
                        {c.short}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------- Products ---------- */}
      {latest.length > 0 ? (
        <>
          {featured.length > 0 && (
            <section className="container-x mt-24">
              <div className="mb-8 flex items-end justify-between gap-4">
                <div>
                  <p className="kicker text-g7">Our favourites</p>
                  <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-g9 sm:text-5xl">Top picks</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
                {featured.map((p, i) => (
                  <ProductCard key={p.id} product={p} priority={i < 2} />
                ))}
              </div>
            </section>
          )}
          <section className="container-x mt-24">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="kicker text-g7">Just landed</p>
                <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-g9 sm:text-5xl">New arrivals</h2>
              </div>
              <Link href="/shop" className="hidden items-center gap-1.5 font-bold text-g7 hover:underline sm:inline-flex">
                View all <IconArrow className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
              {latest.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            <div className="mt-10 text-center sm:hidden">
              <Link href="/shop" className="btn-outline">View all products</Link>
            </div>
          </section>
        </>
      ) : (
        <section className="container-x mt-24">
          <div className="rounded-[28px] bg-mint px-6 py-14 text-center">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-[22px] bg-g9 text-lime">
              <CartMark className="h-14 w-14" />
            </span>
            <h2 className="mt-5 font-display text-3xl font-extrabold text-g9">New stock is on its way</h2>
            <p className="mx-auto mt-2 max-w-md text-muted">Our shelves are being filled right now. Message us on WhatsApp to ask about anything you&apos;re looking for.</p>
          </div>
        </section>
      )}

      {/* ---------- Istilda Pantry ---------- */}
      <section className="container-x mt-24" aria-labelledby="pantry-heading">
        <div className="grid overflow-hidden rounded-[28px] bg-cream lg:grid-cols-[0.85fr_2fr]">
          <div className="relative flex flex-col justify-between gap-8 overflow-hidden bg-spice p-7 text-cream sm:p-10">
            <div className="pointer-events-none absolute -right-10 -bottom-10 flex gap-3" aria-hidden="true">
              <span className="h-28 w-28 rounded-full bg-saffron" />
              <span className="mt-10 h-20 w-20 rounded-full bg-spice-dark" />
            </div>
            <div className="relative">
              <p className="kicker text-saffron">New department</p>
              <h2 id="pantry-heading" className="mt-3 font-display text-4xl leading-[0.95] font-extrabold tracking-tight sm:text-5xl">
                Istilda
                <br />
                Pantry
              </h2>
              <p className="mt-4 max-w-sm leading-relaxed text-cream/90">
                Spices, nuts, dry fruits and granola from brands we trust. Imported and hand-picked, like everything else we stock.
              </p>
            </div>
            <div className="relative">
              <ul className="mb-5 flex flex-wrap gap-2">
                {categoriesIn("pantry").map((c) => (
                  <li key={c.slug}>
                    <Link href={`/pantry?category=${c.slug}`} className="inline-flex h-9 items-center gap-2 rounded-full bg-spice-dark px-3.5 text-sm font-semibold hover:bg-saffron hover:text-cocoa">
                      <CategoryIcon slug={c.slug} className="h-4 w-4" />
                      {c.short}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/pantry" className="btn h-[52px] bg-saffron px-7 text-base text-cocoa hover:bg-cream">
                Visit the Pantry <IconArrow />
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-6 p-5 sm:p-8">
            <div className="flex items-baseline justify-between gap-4">
              <p className="kicker text-spice">On the shelves</p>
              <Link href="/pantry" className="inline-flex items-center gap-1.5 text-sm font-bold text-spice hover:underline">
                All pantry products <IconArrow className="h-4 w-4" />
              </Link>
            </div>
            {pantryProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-4 xl:grid-cols-4">
                {pantryProducts.map((p) => (
                  <div key={p.id} className="rounded-[22px] bg-white p-2.5 pb-3">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid h-full grid-cols-2 gap-3 md:grid-cols-4">
                {categoriesIn("pantry").map((c, i) => (
                  <Link
                    key={c.slug}
                    href={`/pantry?category=${c.slug}`}
                    className={`flex min-h-[180px] flex-col justify-between rounded-[22px] p-5 transition-transform hover:-translate-y-1 ${
                      ["bg-white text-spice", "bg-saffron text-cocoa", "bg-white text-spice", "bg-cream-dark text-cocoa"][i % 4]
                    }`}
                  >
                    <CategoryIcon slug={c.slug} className="h-12 w-12" strokeWidth={1.4} />
                    <span>
                      <span className="block font-display text-xl font-extrabold">{c.name}</span>
                      <span className="text-sm opacity-80">{c.blurb}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
            <ul className="mt-auto grid gap-3 border-t border-cream-dark pt-5 sm:grid-cols-3">
              {[
                { t: "Brands we trust", d: "Sealed, branded packs" },
                { t: "Best-before shown", d: "For the stock we have now" },
                { t: "Allergy info up front", d: "Flagged on the product page" },
              ].map((x) => (
                <li key={x.t} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-saffron" aria-hidden="true" />
                  <span className="text-sm text-cocoa">
                    <b className="font-bold">{x.t}.</b> {x.d}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="container-x mt-24">
        <div className="rounded-[28px] bg-mint p-6 sm:p-10 lg:p-14">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_2fr] lg:items-center">
            <div>
              <p className="kicker text-g7">Simple ordering</p>
              <h2 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-g9">How it works</h2>
              <p className="mt-3 text-muted">No card details, no surprises. You send a request, we confirm the details, then you pay.</p>
              <Link href="/how-to-order" className="mt-5 inline-flex items-center gap-1.5 font-bold text-g7 hover:underline">
                Read more <IconArrow className="h-4 w-4" />
              </Link>
            </div>
            <ol className="grid gap-4 sm:grid-cols-3">
              {[
                { n: "1", t: "Pick your items", d: "Add what you love to your cart. Choose sizes, colours or lengths where offered.", tone: "bg-white" },
                { n: "2", t: "Send your request", d: "Fill in your name, phone and delivery location. Submit here or send it on WhatsApp.", tone: "bg-lime" },
                { n: "3", t: "We confirm, you pay", d: "We call or message to confirm stock, delivery and payment. Then it's on its way.", tone: "bg-g9 text-white" },
              ].map((s) => (
                <li key={s.n} className={`rounded-[22px] p-6 ${s.tone}`}>
                  <span className={`font-display text-5xl font-extrabold ${s.tone.includes("g9") ? "text-lime" : "text-g9"}`}>{s.n}</span>
                  <h3 className={`mt-4 font-display text-xl font-extrabold ${s.tone.includes("g9") ? "text-white" : "text-g9"}`}>{s.t}</h3>
                  <p className={`mt-2 text-[15px] leading-relaxed ${s.tone.includes("g9") ? "text-mint" : "text-ink/80"}`}>{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---------- Promise ---------- */}
      <section className="container-x mt-16">
        <ul className="grid gap-4 md:grid-cols-3">
          {[
            { icon: <IconShield />, t: "Confirm before you pay", d: "Every order is checked with you first: price, stock and delivery." },
            { icon: <IconChat />, t: "Real people on WhatsApp", d: "Ask about sizes, colours or anything else before you order." },
            { icon: <IconBox />, t: "Hand-picked imports", d: "We choose every item we stock, from hair and handbags to pantry staples." },
          ].map((x) => (
            <li key={x.t} className="flex gap-4 rounded-[22px] border-[1.5px] border-line p-6">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[14px] bg-g9 text-lime">{x.icon}</span>
              <div>
                <h3 className="font-display text-lg font-extrabold text-g9">{x.t}</h3>
                <p className="mt-1 text-[15px] text-muted">{x.d}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- CTA ---------- */}
      {settings.whatsapp_number && (
        <section className="container-x mt-16">
          <div className="relative overflow-hidden rounded-[28px] bg-lime p-8 sm:p-12">
            <div className="pointer-events-none absolute -top-10 -right-10 hidden gap-4 sm:flex" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-24 w-24 rounded-full border-[12px] border-g9/90" />
              ))}
            </div>
            <h2 className="max-w-xl font-display text-3xl leading-tight font-extrabold tracking-tight text-g9 sm:text-5xl">Can&apos;t find it? Ask us.</h2>
            <p className="mt-3 max-w-lg text-g9/85 sm:text-lg">Send us a photo or a description on WhatsApp and we&apos;ll tell you if we can bring it in.</p>
            <a
              href={waLink(settings.whatsapp_number, "Hello Istilda Importers! I'm looking for something specific.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary mt-6 h-[52px] px-7 text-base"
            >
              <IconWhatsApp /> Message us on WhatsApp
            </a>
          </div>
        </section>
      )}
    </>
  );
}
