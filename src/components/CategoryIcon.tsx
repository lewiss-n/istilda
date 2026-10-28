const PATHS: Record<string, React.ReactNode> = {
  wigs: (
    <>
      <path d="M12 3C7.6 3 5 6.2 5 10.5V18c0 1.3.6 2.4 1.6 3" />
      <path d="M12 3c4.4 0 7 3.2 7 7.5V18c0 1.3-.6 2.4-1.6 3" />
      <path d="M8.2 9.5c2.2-.2 4.6-1.4 6-3.4.6 1.6 1.4 2.8 1.8 3.4" />
      <path d="M8.5 11.5v1.5a3.5 3.5 0 0 0 7 0v-1.5" />
      <path d="M10 18.5 9 21m5-2.5 1 2.5" />
    </>
  ),
  handbags: (
    <>
      <path d="M5.5 9h13l-1.2 10.2a2 2 0 0 1-2 1.8H8.7a2 2 0 0 1-2-1.8z" />
      <path d="M9 9V7a3 3 0 0 1 6 0v2" />
      <path d="M10.5 13h3" />
    </>
  ),
  "tote-bags": (
    <>
      <path d="M4 9h16l-1.4 10.4a1.8 1.8 0 0 1-1.8 1.6H7.2a1.8 1.8 0 0 1-1.8-1.6z" />
      <path d="M8 9V8c0-2.8 1.8-5 4-5s4 2.2 4 5v1" />
      <path d="M4.6 13.5h14.8" />
    </>
  ),
  electronics: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
      <path d="M9.5 6.5h5" />
    </>
  ),
  cosmetics: (
    <>
      <path d="M9 21h6v-8H9z" />
      <path d="M10 13V7.5L14 5v8" />
      <path d="M8 13h8" />
    </>
  ),
  perfumes: (
    <>
      <rect x="5.5" y="9" width="13" height="12" rx="3.5" />
      <path d="M10 9V6.5h4V9" />
      <path d="M9 3h6v3.5H9z" />
      <path d="M9 15h6" />
    </>
  ),
  headwear: (
    <>
      <path d="M2.5 16.5c0 1.7 4.3 3 9.5 3s9.5-1.3 9.5-3" />
      <path d="M6 16.5c0-5.5 2.6-9 6-9s6 3.5 6 9" />
      <path d="M6.6 13.2c3.6 1 7.2 1 10.8 0" />
      <path d="M17 8.5c1.4-1.4 3-1.6 4-1" />
    </>
  ),
  shoes: (
    <>
      <path d="M2.5 16.5V11l5-1.2 3 3.2h3.8l5.6 1.8c1.2.4 1.6 1.2 1.6 2.2v.5z" />
      <path d="M2.5 19.5h19" />
      <path d="M9 12.2 10.2 11m.8 2.6 1.2-1.3" />
    </>
  ),
  sandals: (
    <>
      <path d="M9 3c3 0 5 3 5 8.5S12.6 21 9 21s-5-3.9-5-9.5S6 3 9 3z" />
      <path d="M9 8 5.6 12M9 8l3.8 3.4" />
      <path d="M15.5 5.5c2.2.4 4 2.8 4 6.5s-1.2 7.5-3.5 8" />
    </>
  ),
  tops: (
    <>
      <path d="M8.5 3 3 6l2 5 2-1v10.5h10V10l2 1 2-5-5.5-3c-.8 1.8-2 2.7-3.5 2.7S9.3 4.8 8.5 3z" />
      <path d="M7 17h10" />
    </>
  ),
  kitchen: (
    <>
      <path d="M4 10.5h16v5.5a4.5 4.5 0 0 1-4.5 4.5h-7A4.5 4.5 0 0 1 4 16z" />
      <path d="M2.5 10.5h19" />
      <path d="M10 7.5h4" />
      <path d="M9 3.5c0 1 1 1 1 2M14 3.5c0 1 1 1 1 2" />
    </>
  ),
};

export function CategoryIcon({ slug, className = "h-6 w-6", strokeWidth = 1.6 }: { slug: string; className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[slug] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  );
}
