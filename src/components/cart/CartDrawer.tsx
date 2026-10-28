"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "./CartProvider";
import { ksh } from "@/lib/format";
import { imageUrl } from "@/lib/img";
import { IconClose, IconMinus, IconPlus, IconTrash } from "../Icons";
import { CartMark } from "../Logo";

export function CartDrawer() {
  const { items, drawerOpen, setDrawerOpen, setQty, remove, subtotal, count } = useCart();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen, setDrawerOpen]);

  return (
    <div className={`fixed inset-0 z-50 ${drawerOpen ? "" : "pointer-events-none"}`} aria-hidden={!drawerOpen}>
      <div
        className={`absolute inset-0 bg-g9/50 backdrop-blur-[2px] transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0"}`}
        onClick={() => setDrawerOpen(false)}
      />
      <aside
        role="dialog"
        aria-label="Your cart"
        className={`absolute top-0 right-0 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-xl font-extrabold text-g9">
            Your cart <span className="text-muted">({count})</span>
          </h2>
          <button className="grid h-11 w-11 place-items-center rounded-full hover:bg-alt" onClick={() => setDrawerOpen(false)} aria-label="Close cart">
            <IconClose />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="grid h-20 w-20 place-items-center rounded-[22px] bg-mint text-g9">
              <CartMark className="h-14 w-14" />
            </span>
            <p className="text-muted">Your cart is empty.</p>
            <Link href="/shop" className="btn-primary" onClick={() => setDrawerOpen(false)}>
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((i) => (
                <li key={i.key} className="flex gap-3 py-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[10px] bg-alt">
                    {i.image && <img src={imageUrl(i.image, "sm")} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link href={`/product/${i.slug}`} onClick={() => setDrawerOpen(false)} className="truncate font-semibold hover:underline">
                      {i.name}
                    </Link>
                    {i.option && (
                      <span className="text-sm text-muted">
                        {i.optionLabel || "Option"}: {i.option}
                      </span>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-line">
                        <button className="grid h-9 w-9 place-items-center" onClick={() => setQty(i.key, i.qty - 1)} aria-label="Fewer">
                          <IconMinus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">{i.qty}</span>
                        <button className="grid h-9 w-9 place-items-center" onClick={() => setQty(i.key, i.qty + 1)} aria-label="More">
                          <IconPlus className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="font-display font-bold text-g9">{ksh(i.price * i.qty)}</span>
                    </div>
                  </div>
                  <button className="grid h-9 w-9 place-items-center self-start rounded-full text-muted hover:bg-alt hover:text-danger" onClick={() => remove(i.key)} aria-label={`Remove ${i.name}`}>
                    <IconTrash className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="border-t border-line bg-alt p-5">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold">Subtotal</span>
                <span className="font-display text-xl font-extrabold text-g9">{ksh(subtotal)}</span>
              </div>
              <p className="mb-4 text-sm text-muted">Delivery is confirmed with you after you send your order.</p>
              <Link href="/checkout" className="btn-primary w-full" onClick={() => setDrawerOpen(false)}>
                Request this order
              </Link>
              <Link href="/cart" className="mt-2 block py-2 text-center text-sm font-semibold text-g7 hover:underline" onClick={() => setDrawerOpen(false)}>
                View full cart
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
