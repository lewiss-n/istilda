import Link from "next/link";
import { CartMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="grid min-h-[70vh] place-items-center px-6 py-20 text-center">
      <div>
        <span className="mx-auto grid h-24 w-24 place-items-center rounded-[26px] bg-g9 text-lime">
          <CartMark className="h-16 w-16" />
        </span>
        <h1 className="mt-6 font-display text-5xl font-extrabold tracking-tight text-g9">Page not found</h1>
        <p className="mt-3 text-muted">This item or page may have moved or sold out.</p>
        <Link href="/shop" className="btn-primary mt-8">Go to the shop</Link>
      </div>
    </main>
  );
}
