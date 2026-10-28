import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin, passwordConfigured } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  const configured = await passwordConfigured();
  return (
    <main className="grid min-h-screen place-items-center bg-g9 px-4 py-10">
      <div className="pointer-events-none fixed top-8 right-8 hidden gap-4 md:flex" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-16 w-16 rounded-full border-[10px] border-g7" />
        ))}
      </div>
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex justify-center">
          <Logo variant="dark" size="lg" />
        </div>
        <div className="rounded-[24px] bg-white p-7 shadow-2xl sm:p-8">
          <h1 className="font-display text-2xl font-extrabold text-g9">Store admin</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage products and orders.</p>
          {configured ? (
            <LoginForm />
          ) : (
            <p className="mt-6 rounded-[12px] bg-red-50 p-4 text-sm text-danger">
              No admin password is set. Add <code className="font-mono font-bold">ADMIN_PASSWORD</code> to your <code className="font-mono">.env</code> file and restart the site.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
