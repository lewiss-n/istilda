export function CartMark({ className = "", strokeScale = 1 }: { className?: string; strokeScale?: number }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M18 27 H24.5 C26.5 27 28 28.2 28.5 30.2 L35.5 59.5 C36 61.4 37.6 62.6 39.6 62.6 H72.5 C74.4 62.6 76 61.4 76.5 59.6 L82.5 39.5 C83.2 37.2 81.5 35 79.1 35 H30.3"
        strokeWidth={4.5 * strokeScale}
      />
      <path d="M33 49 H79" strokeWidth={3 * strokeScale} />
      <circle cx="42" cy="74" r="4.6" strokeWidth={4.5 * strokeScale} />
      <circle cx="70" cy="74" r="4.6" strokeWidth={4.5 * strokeScale} />
    </svg>
  );
}

export function LogoTile({ size = 40, variant = "green" }: { size?: number; variant?: "green" | "lime" }) {
  const cls = variant === "green" ? "bg-g9 text-lime" : "bg-lime text-g9";
  return (
    <span className={`inline-block shrink-0 ${cls}`} style={{ width: size, height: size, borderRadius: size * 0.22 }}>
      <CartMark className="h-full w-full" strokeScale={size < 36 ? 1.4 : 1} />
    </span>
  );
}

export function Logo({ variant = "light", size = "md" }: { variant?: "light" | "dark"; size?: "md" | "lg" }) {
  const onDark = variant === "dark";
  const tile = size === "lg" ? 52 : 40;
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoTile size={tile} variant={onDark ? "lime" : "green"} />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display font-extrabold tracking-[-0.03em] ${onDark ? "text-lime" : "text-g9"} ${
            size === "lg" ? "text-[30px]" : "text-[23px]"
          }`}
        >
          Istilda
        </span>
        <span
          className={`font-display font-semibold ${onDark ? "text-white" : "text-g9"} ${
            size === "lg" ? "mt-1 text-[8.5px] tracking-[0.5em]" : "mt-[3px] text-[7px] tracking-[0.47em]"
          }`}
        >
          IMPORTERS
        </span>
      </span>
    </span>
  );
}
