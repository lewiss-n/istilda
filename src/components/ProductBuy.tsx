"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "./cart/CartProvider";
import { IconMinus, IconPlus } from "./Icons";

type Props = {
  product: { productId: number; slug: string; name: string; price: number; image: string | null; optionLabel: string };
  options: string[];
  inStock: boolean;
};

export function ProductBuy({ product, options, inStock }: Props) {
  const { add } = useCart();
  const router = useRouter();
  const [option, setOption] = useState(options.length === 1 ? options[0] : "");
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const label = product.optionLabel || "Option";

  const go = (buyNow: boolean) => {
    if (options.length && !option) {
      setError(`Please choose a ${label.toLowerCase()}.`);
      return;
    }
    setError("");
    add({ ...product, option }, qty, !buyNow);
    if (buyNow) router.push("/checkout");
  };

  if (!inStock) {
    return (
      <div className="mt-6 rounded-[16px] border-[1.5px] border-line bg-alt p-5">
        <p className="font-display text-lg font-extrabold text-g9">Sold out for now</p>
        <p className="mt-1 text-sm text-muted">Message us on WhatsApp and we&apos;ll let you know when it&apos;s back.</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {options.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">
            {label}
            {option && <span className="font-normal text-muted">: {option}</span>}
          </legend>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => {
                  setOption(o);
                  setError("");
                }}
                aria-pressed={option === o}
                className={`min-h-11 rounded-[10px] border-[1.5px] px-4 text-[15px] font-semibold transition ${
                  option === o ? "border-g9 bg-g9 text-white" : "border-line bg-white hover:border-g9"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
          {error && (
            <p className="mt-2 text-sm font-semibold text-danger" role="alert">
              {error}
            </p>
          )}
        </fieldset>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="flex h-[52px] items-center rounded-[10px] border-[1.5px] border-line">
          <button type="button" className="grid h-full w-12 place-items-center" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
            <IconMinus className="h-4 w-4" />
          </button>
          <span className="w-8 text-center font-display text-lg font-bold" aria-live="polite">{qty}</span>
          <button type="button" className="grid h-full w-12 place-items-center" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="Increase quantity">
            <IconPlus className="h-4 w-4" />
          </button>
        </div>
        <button type="button" onClick={() => go(false)} className="btn-primary h-[52px] flex-1 text-base">
          Add to cart
        </button>
      </div>
      <button type="button" onClick={() => go(true)} className="btn-lime mt-3 h-[52px] w-full text-base">
        Order now
      </button>
    </div>
  );
}
