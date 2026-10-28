import Link from "next/link";
import { dashboardStats } from "@/lib/analytics";
import { countNewOrders, listOrders, STATUS_LABEL } from "@/lib/orders";
import { getPublicSettings } from "@/lib/settings";
import { ksh, timeAgo } from "@/lib/format";
import { Card, ChannelPill, PageHead, StatusPill, TabLink } from "./ui";
import { BarList, TrafficChart } from "./charts";

export const metadata = { title: "Dashboard" };

const RANGES = [7, 30, 90];

function Delta({ now, before }: { now: number; before: number }) {
  if (!before && !now) return <span className="text-xs text-muted">No data yet</span>;
  if (!before) return <span className="text-xs font-semibold text-g7">New this period</span>;
  const pct = Math.round(((now - before) / before) * 100);
  const up = pct >= 0;
  return (
    <span className={`text-xs font-semibold ${up ? "text-g7" : "text-danger"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct)}% <span className="font-normal text-muted">vs previous</span>
    </span>
  );
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const sp = await searchParams;
  const days = RANGES.includes(Number(sp.days)) ? Number(sp.days) : 30;
  const s = await dashboardStats(days);
  const c = s.current;
  const p = s.previous;
  // Share of visitor sessions that sent an order from the store (orders you log by hand aren't counted here).
  const conv = c.sessions ? Math.min(100, (c.orderSessions / c.sessions) * 100) : 0;
  const convPrev = p.sessions ? Math.min(100, (p.orderSessions / p.sessions) * 100) : 0;
  const recent = await listOrders({ limit: 6 });
  const newCount = await countNewOrders();
  const settings = await getPublicSettings();

  const kpis = [
    { label: "Visitors", value: c.visitors.toLocaleString(), now: c.visitors, before: p.visitors, tone: "bg-g9 text-white", sub: "text-mint" },
    { label: "Page views", value: c.pageviews.toLocaleString(), now: c.pageviews, before: p.pageviews, tone: "bg-white", sub: "" },
    { label: "Order requests", value: c.orders.toLocaleString(), now: c.orders, before: p.orders, tone: "bg-lime text-g9", sub: "" },
    { label: "Requested value", value: ksh(c.orderValue), now: c.orderValue, before: p.orderValue, tone: "bg-white", sub: "" },
    { label: "Conversion", value: `${conv.toFixed(1)}%`, now: conv, before: convPrev, tone: "bg-white", sub: "" },
  ];

  const funnel = [
    { label: "Visits", value: c.sessions },
    { label: "Viewed a product", value: c.productViewSessions },
    { label: "Added to cart", value: c.cartSessions },
    { label: "Sent an order request", value: c.orderSessions },
  ];
  const channelTotal = c.websiteOrders + c.whatsappOrders;

  return (
    <>
      <PageHead
        title="Dashboard"
        sub={`Last ${days} days · Nairobi time`}
        action={
          <div className="flex flex-wrap gap-2">
            {RANGES.map((r) => (
              <TabLink key={r} href={`/admin?days=${r}`} active={r === days}>{r} days</TabLink>
            ))}
          </div>
        }
      />

      {!settings.whatsapp_number && (
        <p className="mb-5 rounded-[12px] bg-red-50 px-4 py-3 text-sm text-danger">
          <b>WhatsApp ordering is off.</b> Add your WhatsApp number in <Link href="/admin/settings" className="font-bold underline">Settings</Link> to show WhatsApp buttons on the store.
        </p>
      )}
      {newCount > 0 && (
        <Link href="/admin/orders?status=new" className="mb-5 flex items-center justify-between rounded-[14px] bg-lime px-4 py-3 font-semibold text-g9 hover:bg-lime-dark">
          <span>You have {newCount} new order request{newCount === 1 ? "" : "s"} waiting.</span>
          <span>View →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <div key={k.label} className={`rounded-[18px] p-4 ring-1 ring-line/70 sm:p-5 ${k.tone}`}>
            <p className={`text-sm font-semibold ${k.sub || "text-muted"} ${k.tone.includes("lime") ? "!text-g9/80" : ""}`}>{k.label}</p>
            <p className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{k.value}</p>
            <div className={`mt-1 ${k.tone.includes("g9 text-white") ? "[&_*]:!text-lime" : ""}`}>
              <Delta now={k.now} before={k.before} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-extrabold text-g9">Traffic & orders</h2>
            <span className="flex items-center gap-2 text-sm text-muted">
              <span className="relative flex h-2.5 w-2.5">
                {s.liveVisitors > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-g7 opacity-60" />}
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${s.liveVisitors > 0 ? "bg-g7" : "bg-line"}`} />
              </span>
              {s.liveVisitors} on the store now
            </span>
          </div>
          <TrafficChart series={s.series} />
        </Card>

        <Card>
          <h2 className="font-display text-lg font-extrabold text-g9">Shopping funnel</h2>
          <ol className="mt-4 space-y-3">
            {funnel.map((f, i) => {
              const pct = funnel[0].value ? (f.value / funnel[0].value) * 100 : 0;
              return (
                <li key={f.label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{f.label}</span>
                    <span className="font-bold text-g9">{f.value.toLocaleString()}{i > 0 && funnel[0].value ? <span className="ml-1 font-normal text-muted">({pct.toFixed(0)}%)</span> : null}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-alt">
                    <div className={`h-full rounded-full ${["bg-g9", "bg-g7", "bg-lime-dark", "bg-lime"][i]}`} style={{ width: `${Math.max(i === 0 && f.value ? 100 : pct, f.value ? 2 : 0)}%` }} />
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="mt-6 border-t border-line pt-4">
            <h3 className="text-sm font-bold text-g9">Where orders came from</h3>
            {channelTotal ? (
              <>
                <div className="mt-2 flex h-3 overflow-hidden rounded-full">
                  <div className="bg-g9" style={{ width: `${(c.websiteOrders / channelTotal) * 100}%` }} />
                  <div className="bg-lime" style={{ width: `${(c.whatsappOrders / channelTotal) * 100}%` }} />
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-g9" /> Website {c.websiteOrders}</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-lime ring-1 ring-g9/30" /> WhatsApp {c.whatsappOrders}</span>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted">No orders in this period yet.</p>
            )}
            <p className="mt-3 text-sm text-muted">WhatsApp chat button taps: <b className="text-g9">{c.waClicks}</b></p>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <h2 className="mb-4 font-display text-lg font-extrabold text-g9">Most viewed products</h2>
          <BarList
            empty="No product views yet."
            valueLabel="Views · adds to cart"
            rows={s.topProducts.map((t) => ({
              label: <Link href={`/admin/products/${t.id}`} className="hover:underline">{t.name}</Link>,
              value: t.views,
              sub: `· ${t.adds}`,
            }))}
          />
        </Card>
        <Card>
          <h2 className="mb-4 font-display text-lg font-extrabold text-g9">Most requested</h2>
          <BarList empty="No orders yet." valueLabel="Units" rows={s.ordered.map((o) => ({ label: o.name, value: o.qty, sub: ksh(o.value) }))} />
        </Card>
        <Card>
          <h2 className="mb-4 font-display text-lg font-extrabold text-g9">Traffic sources</h2>
          <BarList empty="No visits yet." valueLabel="Visitors" rows={s.referrers.map((r) => ({ label: r.source, value: r.visitors }))} />
        </Card>
        <Card>
          <h2 className="mb-4 font-display text-lg font-extrabold text-g9">Top pages</h2>
          <BarList empty="No visits yet." valueLabel="Views" rows={s.topPages.map((r) => ({ label: r.path === "/" ? "Home" : r.path, value: r.views }))} />
        </Card>
        <Card>
          <h2 className="mb-4 font-display text-lg font-extrabold text-g9">Devices</h2>
          <BarList empty="No visits yet." valueLabel="Visitors" rows={s.devices.map((d) => ({ label: d.device, value: d.visitors }))} />
        </Card>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-extrabold text-g9">Latest orders</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-g7 hover:underline">All →</Link>
          </div>
          {recent.length ? (
            <ul className="divide-y divide-line">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 py-2.5 hover:bg-alt">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{o.customer_name}</span>
                      <span className="text-xs text-muted">{o.ref} · {timeAgo(o.created_at)}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold">{ksh(o.subtotal)}</span>
                      <span className="flex gap-1"><ChannelPill channel={o.channel} /><StatusPill status={o.status} label={STATUS_LABEL[o.status]} /></span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted">No orders yet.</p>
          )}
        </Card>
      </div>
      <p className="mt-6 text-xs text-muted">
        Analytics are collected by the store itself, without third-party trackers. Bots and your own visits while signed in are not counted.
      </p>
    </>
  );
}
