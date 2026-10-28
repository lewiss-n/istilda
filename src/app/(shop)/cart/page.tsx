import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <div className="container-x pt-8">
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-g9 sm:text-5xl">Your cart</h1>
      <CartView />
    </div>
  );
}
