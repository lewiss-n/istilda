import Link from "next/link";
import type { OrderStatus } from "@/lib/orders";

export function PageHead({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-g9 sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-[20px] bg-white p-5 shadow-[0_1px_0_var(--color-line)] ring-1 ring-line/70 sm:p-6 ${className}`}>{children}</section>;
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  new: "bg-lime text-g9",
  contacted: "bg-mint text-g9",
  confirmed: "bg-g7 text-white",
  delivered: "bg-g9 text-lime",
  cancelled: "bg-alt text-muted ring-1 ring-line",
};

export function StatusPill({ status, label }: { status: OrderStatus; label: string }) {
  return <span className={`badge ${STATUS_STYLE[status]}`}>{label}</span>;
}

export function ChannelPill({ channel }: { channel: string }) {
  return channel === "whatsapp" ? (
    <span className="badge bg-[#e8f8ec] text-[#13652d]">WhatsApp</span>
  ) : (
    <span className="badge bg-alt text-g9 ring-1 ring-line">Website</span>
  );
}

export function Flash({ children }: { children: React.ReactNode }) {
  return <p className="mb-5 rounded-[12px] bg-lime px-4 py-3 text-sm font-semibold text-g9" role="status">{children}</p>;
}

export function TabLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`rounded-full px-3.5 py-2 text-sm font-semibold whitespace-nowrap ${active ? "bg-g9 text-white" : "bg-white text-ink ring-1 ring-line hover:ring-g9"}`}>
      {children}
    </Link>
  );
}
