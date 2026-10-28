"use client";

import Link from "next/link";
import { useCart, type CartItem } from "./cart/CartProvider";
import { IconPlus, IconArrow } from "./Icons";

export function QuickAdd({ item, needsOption }: { item: Omit<CartItem, "key" | "qty">; needsOption: boolean }) {
  const { add } = useCart();
  const cls =
    "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mint text-g9 transition-colors hover:bg-g9 hover:text-lime";
  if (needsOption) {
    return (
      <Link href={`/product/${item.slug}`} className={cls} aria-label={`Choose options for ${item.name}`}>
        <IconArrow className="h-5 w-5" />
      </Link>
    );
  }
  return (
    <button type="button" onClick={() => add(item)} className={cls} aria-label={`Add ${item.name} to cart`}>
      <IconPlus className="h-5 w-5" />
    </button>
  );
}
