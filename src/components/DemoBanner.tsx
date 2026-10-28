export function DemoBanner({ variant = "shop" }: { variant?: "shop" | "admin" }) {
  return (
    <div role="note" className="bg-[#fff4d6] px-4 py-2 text-center text-[13px] font-semibold text-[#5c3d00]">
      {variant === "shop"
        ? "Demo store: products and prices are samples. Orders you send here are for testing only."
        : "Demo mode: sample data is shown, and the admin password can't be changed here."}
    </div>
  );
}
