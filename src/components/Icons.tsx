type P = { className?: string };
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconSearch = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
);
export const IconMenu = ({ className = "h-6 w-6" }: P) => (
  <svg {...base} className={className}><path d="M4 7h16M4 12h16M4 17h10" /></svg>
);
export const IconClose = ({ className = "h-6 w-6" }: P) => (
  <svg {...base} className={className}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const IconArrow = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const IconPlus = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M12 5v14M5 12h14" /></svg>
);
export const IconMinus = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M5 12h14" /></svg>
);
export const IconTrash = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>
);
export const IconCheck = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}><path d="m5 12 5 5L20 7" /></svg>
);
export const IconTruck = ({ className = "h-6 w-6" }: P) => (
  <svg {...base} className={className}><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>
);
export const IconShield = ({ className = "h-6 w-6" }: P) => (
  <svg {...base} className={className}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const IconChat = ({ className = "h-6 w-6" }: P) => (
  <svg {...base} className={className}><path d="M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z" /></svg>
);
export const IconSparkle = ({ className = "h-6 w-6" }: P) => (
  <svg {...base} className={className}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" /></svg>
);
export const IconBox = ({ className = "h-6 w-6" }: P) => (
  <svg {...base} className={className}><path d="M21 8 12 3 3 8l9 5z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></svg>
);

/** Generic chat bubble used on WhatsApp buttons (the label says "WhatsApp"). */
export const IconWhatsApp = ({ className = "h-5 w-5" }: P) => (
  <svg {...base} className={className}>
    <path d="M21 11.5a8.4 8.4 0 0 1-12.2 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z" />
    <path d="M8.5 10.5h7M8.5 13.5h4.5" />
  </svg>
);
