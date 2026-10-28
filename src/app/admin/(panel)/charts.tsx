import type { DailyPoint } from "@/lib/analytics";

function niceMax(v: number) {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const steps = [1, 2, 2.5, 5, 10];
  for (const s of steps) if (s * pow >= v) return s * pow;
  return 10 * pow;
}

function dayLabel(day: string, long = false) {
  const d = new Date(day + "T12:00:00Z");
  return d.toLocaleDateString("en-KE", long ? { weekday: "short", day: "numeric", month: "short" } : { day: "numeric", month: "short" });
}

/** Visitors as bars, order requests as a line on its own scale. */
export function TrafficChart({ series }: { series: DailyPoint[] }) {
  const W = 800;
  const H = 260;
  const pad = { l: 36, r: 36, t: 16, b: 30 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const vMax = niceMax(Math.max(...series.map((s) => s.visitors), 1));
  const oMax = niceMax(Math.max(...series.map((s) => s.orders), 1));
  const step = iw / series.length;
  const bw = Math.max(2, Math.min(28, step * 0.62));
  const x = (i: number) => pad.l + step * i + step / 2;
  const yv = (v: number) => pad.t + ih - (v / vMax) * ih;
  const yo = (v: number) => pad.t + ih - (v / oMax) * ih;
  const labelEvery = Math.ceil(series.length / 8);
  const line = series.map((s, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${yo(s.orders).toFixed(1)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-[3px] bg-g7" /> Visitors</span>
        <span className="flex items-center gap-2"><span className="h-1 w-5 rounded-full bg-[#e07b00]" /> Order requests</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Daily visitors and order requests">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={pad.t + ih * (1 - t)} y2={pad.t + ih * (1 - t)} stroke="var(--color-line)" strokeDasharray={t ? "3 4" : undefined} />
            <text x={pad.l - 8} y={pad.t + ih * (1 - t) + 4} textAnchor="end" fontSize="11" fill="var(--color-muted)">{Math.round(vMax * t)}</text>
            <text x={W - pad.r + 8} y={pad.t + ih * (1 - t) + 4} fontSize="11" fill="#b35f00">{Math.round(oMax * t)}</text>
          </g>
        ))}
        {series.map((s, i) => (
          <g key={s.day}>
            <rect x={x(i) - bw / 2} y={yv(s.visitors)} width={bw} height={Math.max(0, pad.t + ih - yv(s.visitors))} rx={Math.min(5, bw / 3)} fill="var(--color-g7)">
              <title>{`${dayLabel(s.day, true)}: ${s.visitors} visitors, ${s.pageviews} page views, ${s.orders} orders`}</title>
            </rect>
            {i % labelEvery === 0 && (
              <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--color-muted)">{dayLabel(s.day)}</text>
            )}
          </g>
        ))}
        <path d={line} fill="none" stroke="#e07b00" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {series.map((s, i) =>
          s.orders > 0 ? (
            <circle key={s.day} cx={x(i)} cy={yo(s.orders)} r="4" fill="#fff" stroke="#e07b00" strokeWidth="2.5">
              <title>{`${dayLabel(s.day, true)}: ${s.orders} order request${s.orders === 1 ? "" : "s"}`}</title>
            </circle>
          ) : null,
        )}
      </svg>
    </div>
  );
}

export function BarList({ rows, valueLabel, empty }: { rows: { label: React.ReactNode; value: number; sub?: string }[]; valueLabel?: string; empty: string }) {
  if (!rows.length) return <p className="py-6 text-center text-sm text-muted">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2">
      {valueLabel && (
        <li className="flex justify-end text-xs font-bold tracking-wide text-muted uppercase">{valueLabel}</li>
      )}
      {rows.map((r, i) => (
        <li key={i} className="relative overflow-hidden rounded-[8px]">
          <span className="absolute inset-y-0 left-0 rounded-[8px] bg-mint" style={{ width: `${(r.value / max) * 100}%` }} aria-hidden="true" />
          <span className="relative flex items-center justify-between gap-3 px-3 py-2 text-sm">
            <span className="min-w-0 truncate font-medium">{r.label}</span>
            <span className="shrink-0 font-bold text-g9">
              {r.value.toLocaleString()}
              {r.sub && <span className="ml-1.5 font-normal text-muted">{r.sub}</span>}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
