"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { IconMenu, IconClose } from "@/components/Icons";
import { logoutAction } from "../actions";

const I = {
  dash: <path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z" />,
  orders: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />,
  products: <path d="M21 8 12 3 3 8l9 5zM3 8v8l9 5 9-5V8M12 13v8" />,
  settings: <><path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1" /><circle cx="15" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="17" cy="18" r="2" /></>,
  store: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
};

function Ico({ d }: { d: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
}

export function AdminNav({ newOrders }: { newOrders: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { href: "/admin", label: "Dashboard", icon: I.dash, exact: true },
    { href: "/admin/orders", label: "Orders", icon: I.orders, badge: newOrders },
    { href: "/admin/products", label: "Products", icon: I.products },
    { href: "/admin/settings", label: "Settings", icon: I.settings },
  ];

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Admin">
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-[12px] px-3 py-3 font-semibold transition ${active ? "bg-lime text-g9" : "text-mint hover:bg-g7 hover:text-white"}`}
          >
            <Ico d={l.icon} />
            {l.label}
            {l.badge ? (
              <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-bold ${active ? "bg-g9 text-lime" : "bg-lime text-g9"}`}>{l.badge}</span>
            ) : null}
          </Link>
        );
      })}
      <div className="mt-auto space-y-1 pt-6 pb-4">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-[12px] px-3 py-3 font-semibold text-mint hover:bg-g7 hover:text-white">
          <Ico d={I.store} /> View store
        </Link>
        <form action={logoutAction}>
          <button className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 font-semibold text-mint hover:bg-g7 hover:text-white">
            <Ico d={I.logout} /> Sign out
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between bg-g9 px-4 lg:hidden">
        <Link href="/admin"><Logo variant="dark" /></Link>
        <button onClick={() => setOpen(true)} className="grid h-11 w-11 place-items-center rounded-full text-white hover:bg-g7" aria-label="Open admin menu">
          <IconMenu />
          {newOrders > 0 && <span className="absolute top-3 right-4 h-2.5 w-2.5 rounded-full bg-lime" />}
        </button>
      </div>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-g9 py-6 lg:flex">
        <div className="mb-8 px-6">
          <Link href="/admin"><Logo variant="dark" /></Link>
        </div>
        {nav}
      </aside>
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <aside className={`absolute top-0 left-0 flex h-full w-72 flex-col bg-g9 py-5 transition-transform ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="mb-6 flex items-center justify-between px-5">
            <Logo variant="dark" />
            <button onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full text-white hover:bg-g7" aria-label="Close menu">
              <IconClose />
            </button>
          </div>
          {nav}
        </aside>
      </div>
    </>
  );
}
