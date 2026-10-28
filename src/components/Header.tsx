"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo, CartMark } from "./Logo";
import { CATEGORIES } from "@/lib/categories";
import { CategoryIcon } from "./CategoryIcon";
import { IconClose, IconMenu, IconSearch } from "./Icons";
import { useCart } from "./cart/CartProvider";

const QUICK = ["wigs", "handbags", "cosmetics", "perfumes", "electronics", "shoes"];

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
            {QUICK.map((slug) => {
              const c = CATEGORIES.find((x) => x.slug === slug)!;
              return (
                <Link key={slug} href={`/shop?category=${slug}`} className="rounded-full px-3 py-2 text-[15px] font-medium text-ink/80 hover:bg-mint hover:text-g9">
                  {c.short}
                </Link>
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
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search wigs, bags, perfume…" className="field rounded-full" aria-label="Search products" />
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
          <ul className="px-3 pb-8">
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className="flex items-center gap-3 rounded-xl px-3 py-3 font-medium hover:bg-g7">
                  <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-g7 text-lime">
                    <CategoryIcon slug={c.slug} className="h-5 w-5" />
                  </span>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
