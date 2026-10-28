"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";
import { useCartSync } from "./useCartSync";
import { ksh } from "@/lib/format";
import { imageUrl } from "@/lib/img";
import { IconMinus, IconPlus, IconTrash, IconArrow } from "../Icons";
import { CartMark } from "../Logo";

export function CartView() {
  const { items, ready, setQty, remove, subtotal, count } = useCart();
  const { notice, unavailable } = useCartSync();

  if (!ready) return <div className="mt-10 h-40 animate-pulse rounded-[22px] bg-alt" />;

  if (!items.length) {
    return (
      <div className="mt-8 rounded-[28px] bg-mint px-6 py-16 text-center">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-[22px] bg-g9 text-lime">
          <CartMark className="h-14 w-14" />
        </span>
        <p className="mt-5 font-display text-2xl font-extrabold text-g9">Your cart is empty</p>
        <p className="mt-1 text-muted">Find something you love and it&apos;ll appear here.</p>
        <Link href="/shop" className="btn-primary mt-6">Start shopping</Link>
      </div>
    );
  }

  const blocked = items.some((i) => unavailable.has(i.productId));

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <div>
        {notice && <p className="mb-4 rounded-[12px] bg-mint px-4 py-3 text-sm font-medium text-g9" role="status">{notice}</p>}
        <ul className="divide-y divide-line rounded-[22px] border-[1.5px] border-line">
          {items.map((i) => {
            const out = unavailable.has(i.productId);
            return (
              <li key={i.key} className="flex gap-4 p-4 sm:p-5">
                <Link href={`/product/${i.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-[14px] bg-alt sm:h-28 sm:w-28">
                  {i.image && <img src={imageUrl(i.image, "sm")} alt="" className="h-full w-full object-cover" />}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/product/${i.slug}`} className="font-semibold hover:underline">{i.name}</Link>
                      {i.option && <p className="text-sm text-muted">{i.optionLabel || "Option"}: {i.option}</p>}
                      <p className="text-sm text-muted">{ksh(i.price)} each</p>
                      {out && <p className="mt-1 text-sm font-semibold text-danger">Sold out, please remove it to continue.</p>}
                    </div>
                    <button onClick={() => remove(i.key)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:bg-alt hover:text-danger" aria-label={`Remove ${i.name}`}>
                      <IconTrash className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center rounded-full border-[1.5px] border-line">
                      <button className="grid h-10 w-10 place-items-center" onClick={() => setQty(i.key, i.qty - 1)} aria-label="Fewer">
                        <IconMinus className="h-4 w-4" />
                      </button>
                      <span className="w-7 text-center font-semibold">{i.qty}</span>
                      <button className="grid h-10 w-10 place-items-center" onClick={() => setQty(i.key, i.qty + 1)} aria-label="More">
                        <IconPlus className="h-4 w-4" />
                      </button>
                    </div>
                    <span className="font-display text-lg font-bold text-g9">{ksh(i.price * i.qty)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        <Link href="/shop" className="mt-4 inline-flex items-center gap-1.5 font-semibold text-g7 hover:underline">
          ← Keep shopping
        </Link>
      </div>

      <aside className="h-fit rounded-[22px] bg-g9 p-6 text-white lg:sticky lg:top-24">
        <h2 className="font-display text-xl font-extrabold">Summary</h2>
        <dl className="mt-4 space-y-2 text-mint">
          <div className="flex justify-between"><dt>Items</dt><dd>{count}</dd></div>
          <div className="flex justify-between"><dt>Delivery</dt><dd>Confirmed with you</dd></div>
        </dl>
        <div className="mt-4 flex items-baseline justify-between border-t border-g7 pt-4">
          <span className="font-semibold">Subtotal</span>
          <span className="font-display text-2xl font-extrabold text-lime">{ksh(subtotal)}</span>
        </div>
        {blocked ? (
          <p className="mt-5 rounded-[10px] bg-g7 p-3 text-sm">Remove sold-out items to continue.</p>
        ) : (
          <Link href="/checkout" className="btn-lime mt-5 h-[52px] w-full text-base">
            Request this order <IconArrow />
          </Link>
        )}
        <p className="mt-3 text-center text-[13px] text-mint/80">No payment now. We confirm first.</p>
      </aside>
    </div>
  );
}
