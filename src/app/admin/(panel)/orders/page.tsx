import Link from "next/link";
import { listOrders, statusCounts, ORDER_STATUSES, STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import { displayPhone, formatDateTime, ksh, timeAgo } from "@/lib/format";
import { IconPlus, IconSearch } from "@/components/Icons";
import { Card, ChannelPill, Flash, PageHead, StatusPill, TabLink } from "../ui";

export const metadata = { title: "Orders" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; channel?: string; q?: string; deleted?: string }> }) {
  const sp = await searchParams;
  const status = ORDER_STATUSES.includes(sp.status as OrderStatus) ? (sp.status as OrderStatus) : undefined;
  const channel = sp.channel === "website" || sp.channel === "whatsapp" ? sp.channel : undefined;
  const q = (sp.q ?? "").trim();
  const orders = await listOrders({ status, channel, q: q || undefined });
  const counts = await statusCounts();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const m = { status, channel, q: q || undefined, ...over };
    for (const [k, v] of Object.entries(m)) if (v) p.set(k, v);
    const s = p.toString();
    return `/admin/orders${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHead
        title="Orders"
        sub="Every request from the website and WhatsApp lands here."
        action={
          <Link href="/admin/orders/new" className="btn-primary">
            <IconPlus /> Log a WhatsApp order
          </Link>
        }
      />
      {sp.deleted && <Flash>Order deleted.</Flash>}

      <div className="-mx-4 mb-4 overflow-x-auto px-4">
        <div className="flex w-max gap-2">
          <TabLink href={href({ status: undefined })} active={!status}>All · {total}</TabLink>
          {ORDER_STATUSES.map((s) => (
            <TabLink key={s} href={href({ status: s })} active={status === s}>
              {STATUS_LABEL[s]} · {counts[s] ?? 0}
            </TabLink>
          ))}
        </div>
      </div>

      <form className="mb-5 flex flex-col gap-3 sm:flex-row" role="search">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="relative flex-1">
          <label htmlFor="oq" className="sr-only">Search orders</label>
          <input id="oq" name="q" defaultValue={q} placeholder="Search by reference, name or phone" className="field pl-10" />
          <IconSearch className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
        </div>
        <label htmlFor="och" className="sr-only">Channel</label>
        <select id="och" name="channel" defaultValue={channel ?? ""} className="field sm:w-48">
          <option value="">Website & WhatsApp</option>
          <option value="website">Website only</option>
          <option value="whatsapp">WhatsApp only</option>
        </select>
        <button className="btn-outline">Filter</button>
      </form>

      {orders.length === 0 ? (
        <Card className="py-14 text-center">
          <p className="font-display text-2xl font-extrabold text-g9">No orders here</p>
          <p className="mt-1 text-muted">New order requests will show up here as soon as they&apos;re sent.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0 sm:p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-alt text-xs font-bold tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Items</th>
                  <th className="px-3 py-3 text-right">Value</th>
                  <th className="px-3 py-3">Via</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((o) => (
                  <tr key={o.id} className={`hover:bg-mint/40 ${o.status === "new" ? "bg-lime/10" : ""}`}>
                    <td className="px-5 py-3.5">
                      <Link href={`/admin/orders/${o.id}`} className="font-display font-bold text-g9 hover:underline">{o.ref}</Link>
                      <span className="block text-xs text-muted" title={formatDateTime(o.created_at)}>{timeAgo(o.created_at)}</span>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className="block font-semibold">{o.customer_name}</span>
                      <span className="text-xs text-muted">{displayPhone(o.phone)}</span>
                    </td>
                    <td className="px-3 py-3.5">{o.item_count}</td>
                    <td className="px-3 py-3.5 text-right font-semibold">{ksh(o.subtotal)}</td>
                    <td className="px-3 py-3.5"><ChannelPill channel={o.channel} /></td>
                    <td className="px-5 py-3.5"><StatusPill status={o.status} label={STATUS_LABEL[o.status]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
