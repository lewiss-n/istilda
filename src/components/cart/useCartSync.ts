"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";

/** Refreshes cart prices/names from the server once, and drops items that no longer exist. */
export function useCartSync() {
  const { items, ready, replace } = useCart();
  const done = useRef(false);
  const [notice, setNotice] = useState("");
  const [unavailable, setUnavailable] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!ready || done.current || !items.length) return;
    done.current = true;
    const ids = [...new Set(items.map((i) => i.productId))];
    fetch(`/api/cart?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then(({ products }: { products: { id: number; name: string; slug: string; price: number; inStock: boolean; image: string | null }[] }) => {
        const map = new Map(products.map((p) => [p.id, p]));
        let changed = false;
        const out = new Set<number>();
        const next = items
          .filter((i) => {
            if (!map.has(i.productId)) {
              changed = true;
              return false;
            }
            return true;
          })
          .map((i) => {
            const p = map.get(i.productId)!;
            if (!p.inStock) out.add(p.id);
            if (p.price !== i.price || p.name !== i.name || p.slug !== i.slug || p.image !== i.image) {
              changed = true;
              return { ...i, price: p.price, name: p.name, slug: p.slug, image: p.image };
            }
            return i;
          });
        setUnavailable(out);
        if (changed) {
          replace(next);
          setNotice("We updated your cart with the latest prices and availability.");
        }
      })
      .catch(() => {});
  }, [ready, items, replace]);

  return { notice, unavailable };
}
