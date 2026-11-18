"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo, CartMark } from "./Logo";
import { DEPARTMENTS, categoriesIn } from "@/lib/categories";
import { CategoryIcon } from "./CategoryIcon";
import { IconClose, IconMenu, IconSearch } from "./Icons";
import { useCart } from "./cart/CartProvider";

export function Header({ announcement }: { announcement: string }) {
  const { count, ready, setDrawerOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/shop${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  };

  return (
    <>
      {announcement && (
        <div className="bg-g9 px-4 py-2 text-center text-[13px] font-medium text-mint">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-lime align-middle" aria-hidden="true" />
          {announcement}
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-line/80 bg-white/90 backdrop-blur-md">
        <div className="container-x flex h-[68px] items-center gap-4">
          <button className="-ml-2 grid h-11 w-11 place-items-center rounded-full hover:bg-alt lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <IconMenu />
          </button>
          <Link href="/" aria-label="Istilda Importers home" className="shrink-0">
            <Logo />
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Main">
            <Link href="/shop" className={`rounded-full px-3.5 py-2 text-[15px] font-semibold hover:bg-mint ${pathname === "/shop" ? "text-g7" : ""}`}>
              Shop all
            </Link>
            {DEPARTMENTS.map((d) => {
              const pantry = d.theme === "pantry";
              const current = pathname === `/${d.slug}`;
              return (
                <div key={d.slug} className="group relative">
                  <Link
                    href={`/${d.slug}`}
                    aria-current={current ? "page" : undefined}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[15px] font-medium whitespace-nowrap ${
                      pantry ? "text-spice hover:bg-cream" : "text-ink/80 hover:bg-mint hover:text-g9"
                    } ${current ? "font-semibold" : ""}`}
                  >
                    {pantry && <span className="h-2 w-2 rounded-full bg-saffron" aria-hidden="true" />}
                    {pantry ? "Pantry" : d.name}
                  </Link>
                  {/* Category list on hover or keyboard focus */}
                  <div className="invisible absolute top-full left-0 z-50 pt-2 opacity-0 transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <div className={`w-64 rounded-[18px] p-2 shadow-xl ring-1 ${pantry ? "bg-cream ring-cream-dark" : "bg-white ring-line"}`}>
                      <p className={`px-3 pt-2 pb-1 text-[12px] font-bold tracking-wide uppercase ${pantry ? "text-spice" : "text-g7"}`}>{d.name}</p>
                      <ul>
                        {categoriesIn(d.slug).map((c) => (
                          <li key={c.slug}>
                            <Link
                              href={`/${d.slug}?category=${c.slug}`}
                              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] font-medium ${pantry ? "text-cocoa hover:bg-cream-dark" : "hover:bg-mint"}`}
                            >
                              <CategoryIcon slug={c.slug} className={`h-5 w-5 ${pantry ? "text-spice" : "text-g7"}`} />
                              {c.short}
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link href={`/${d.slug}`} className={`mt-1 block rounded-xl px-3 py-2 text-sm font-bold ${pantry ? "text-spice hover:bg-cream-dark" : "text-g7 hover:bg-mint"}`}>
                        All of {d.name} →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <form onSubmit={submit} className="relative hidden md:block" role="search">
              <label htmlFor="site-search" className="sr-only">Search products</label>
              <input
                id="site-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                className="h-11 w-44 rounded-full border-[1.5px] border-line bg-alt pr-4 pl-10 text-sm transition-all focus:w-60 focus:border-g7 focus:bg-white focus:outline-none xl:w-52"
              />
              <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
            </form>
            <button className="grid h-11 w-11 place-items-center rounded-full hover:bg-alt md:hidden" onClick={() => setSearchOpen((v) => !v)} aria-label="Search">
              <IconSearch />
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative grid h-11 w-11 place-items-center rounded-full bg-g9 text-white transition-transform hover:scale-105"
              aria-label={`Open cart, ${count} items`}
            >
              <CartMark className="h-8 w-8" strokeScale={1.25} />
              {ready && count > 0 && (
                <span className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-lime px-1 font-display text-[11px] font-extrabold text-g9 ring-2 ring-white">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
        {searchOpen && (
          <form onSubmit={submit} className="container-x pb-3 md:hidden" role="search">
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search wigs, perfume, cashews…" className="field rounded-full" aria-label="Search products" />
          </form>
        )}
      </header>

      {/* Mobile menu */}
      <div className={`fixed inset-0 z-50 lg:hidden ${menuOpen ? "" : "pointer-events-none"}`} aria-hidden={!menuOpen}>
        <div className={`absolute inset-0 bg-g9/50 transition-opacity ${menuOpen ? "opacity-100" : "opacity-0"}`} onClick={() => setMenuOpen(false)} />
        <nav
          aria-label="Mobile"
          className={`absolute top-0 left-0 flex h-full w-[86%] max-w-[360px] flex-col overflow-y-auto bg-g9 text-white transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-5">
            <Logo variant="dark" />
            <button className="grid h-11 w-11 place-items-center rounded-full hover:bg-g7" onClick={() => setMenuOpen(false)} aria-label="Close menu">
              <IconClose />
            </button>
          </div>
          <Link href="/shop" className="mx-5 mb-3 rounded-[14px] bg-lime px-4 py-3.5 font-display text-lg font-extrabold text-g9">
            Shop everything →
          </Link>
          <div className="space-y-4 px-3 pb-8">
            {DEPARTMENTS.map((d) => {
              const pantry = d.theme === "pantry";
              return (
                <section key={d.slug} className={pantry ? "rounded-[18px] bg-spice p-1.5" : ""}>
                  <Link href={`/${d.slug}`} className={`flex items-center justify-between rounded-xl px-3 py-2 ${pantry ? "hover:bg-spice-dark" : "hover:bg-g7"}`}>
                    <span>
                      <span className={`block font-display text-lg font-extrabold ${pantry ? "text-cream" : "text-lime"}`}>{d.name}</span>
                      <span className={`block text-[13px] ${pantry ? "text-cream/75" : "text-mint/80"}`}>{d.tagline}</span>
                    </span>
                    <span aria-hidden="true" className={pantry ? "text-saffron" : "text-lime"}>→</span>
                  </Link>
                  <ul>
                    {categoriesIn(d.slug).map((c) => (
                      <li key={c.slug}>
                        <Link href={`/${d.slug}?category=${c.slug}`} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium ${pantry ? "hover:bg-spice-dark" : "hover:bg-g7"}`}>
                          <span className={`grid h-9 w-9 place-items-center rounded-[10px] ${pantry ? "bg-spice-dark text-saffron" : "bg-g7 text-lime"}`}>
                            <CategoryIcon slug={c.slug} className="h-5 w-5" />
                          </span>
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
