"use client";

import { useActionState, useState } from "react";
import { createManualOrderAction } from "../../../actions";
import { useSubmit } from "@/components/useSubmit";
import { ksh } from "@/lib/format";

type P = { id: number; name: string; price: number; options: string };
type Line = { key: number; productId: number | ""; name: string; price: string; qty: string; option: string };

let n = 0;
const blank = (): Line => ({ key: ++n, productId: "", name: "", price: "", qty: "1", option: "" });

export function ManualOrderForm({ products }: { products: P[] }) {
  const [state, action, pending] = useActionState(createManualOrderAction, undefined);
  const onSubmit = useSubmit(action);
  const [lines, setLines] = useState<Line[]>([blank()]);
  const fe = state?.fieldErrors ?? {};
  const byId = new Map(products.map((p) => [p.id, p]));

  const update = (key: number, patch: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  const total = lines.reduce((s, l) => s + (Number(l.price) || 0) * (Number(l.qty) || 0), 0);
  const payload = lines
    .filter((l) => l.productId || l.name.trim())
    .map((l) => ({ productId: l.productId || undefined, name: l.name, price: Number(l.price), qty: Number(l.qty), option: l.option }));

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
      <input type="hidden" name="lines" value={JSON.stringify(payload)} />
      <section className="rounded-[20px] bg-white p-5 ring-1 ring-line/70 sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-g9">Items</h2>
        <div className="mt-4 space-y-4">
          {lines.map((l, idx) => {
            const p = l.productId ? byId.get(l.productId) : undefined;
            const opts = p?.options.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
            return (
              <div key={l.key} className="rounded-[14px] bg-alt p-3 sm:p-4">
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                  <div>
                    <label className="label" htmlFor={`p-${l.key}`}>Product</label>
                    <select
                      id={`p-${l.key}`}
                      className="field"
                      value={l.productId}
                      onChange={(e) => {
                        const id = e.target.value ? Number(e.target.value) : "";
                        const prod = id ? byId.get(id) : undefined;
                        update(l.key, { productId: id, name: prod?.name ?? "", price: prod ? String(prod.price) : l.price, option: "" });
                      }}
                    >
                      <option value="">Something not in the shop…</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} · {ksh(p.price)}</option>
                      ))}
                    </select>
                  </div>
                  {opts.length > 0 ? (
                    <div>
                      <label className="label" htmlFor={`o-${l.key}`}>Option</label>
                      <select id={`o-${l.key}`} className="field" value={l.option} onChange={(e) => update(l.key, { option: e.target.value })}>
                        <option value="">—</option>
                        {opts.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="label" htmlFor={`o-${l.key}`}>Option / detail</label>
                      <input id={`o-${l.key}`} className="field" value={l.option} onChange={(e) => update(l.key, { option: e.target.value })} placeholder="Optional" />
                    </div>
                  )}
                </div>
                {!l.productId && (
                  <div className="mt-3">
                    <label className="label" htmlFor={`n-${l.key}`}>Item name</label>
                    <input id={`n-${l.key}`} className="field" value={l.name} onChange={(e) => update(l.key, { name: e.target.value })} placeholder="What did they order?" />
                  </div>
                )}
                <div className="mt-3 grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                  <div>
                    <label className="label" htmlFor={`pr-${l.key}`}>Price each (KSh)</label>
                    <input id={`pr-${l.key}`} inputMode="numeric" className="field" value={l.price} onChange={(e) => update(l.key, { price: e.target.value.replace(/[^\d]/g, "") })} />
                  </div>
                  <div>
                    <label className="label" htmlFor={`q-${l.key}`}>Qty</label>
                    <input id={`q-${l.key}`} inputMode="numeric" className="field" value={l.qty} onChange={(e) => update(l.key, { qty: e.target.value.replace(/[^\d]/g, "") })} />
                  </div>
                  <button type="button" onClick={() => setLines((ls) => (ls.length > 1 ? ls.filter((x) => x.key !== l.key) : [blank()]))} className="btn text-danger hover:bg-red-50" aria-label={`Remove item ${idx + 1}`}>
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {fe.lines && <p className="mt-2 text-sm text-danger">{fe.lines}</p>}
        <button type="button" onClick={() => setLines((ls) => [...ls, blank()])} className="btn-outline mt-4">+ Add another item</button>
        <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-semibold">Total</span>
          <span className="font-display text-2xl font-extrabold text-g9">{ksh(total)}</span>
        </div>
      </section>

      <div className="space-y-6">
        <section className="rounded-[20px] bg-white p-5 ring-1 ring-line/70 sm:p-6">
          <h2 className="font-display text-lg font-extrabold text-g9">Customer</h2>
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="name" className="label">Name</label>
              <input id="name" name="name" className="field" />
              {fe.name && <p className="mt-1 text-sm text-danger">{fe.name}</p>}
            </div>
            <div>
              <label htmlFor="phone" className="label">Phone / WhatsApp</label>
              <input id="phone" name="phone" type="tel" className="field" placeholder="07XX XXX XXX" />
              {fe.phone && <p className="mt-1 text-sm text-danger">{fe.phone}</p>}
            </div>
            <div>
              <label htmlFor="location" className="label">Delivery location</label>
              <input id="location" name="location" className="field" />
            </div>
            <div>
              <label htmlFor="email" className="label">Email <span className="font-normal text-muted">(optional)</span></label>
              <input id="email" name="email" type="email" className="field" />
            </div>
            <div>
              <label htmlFor="notes" className="label">Notes</label>
              <textarea id="notes" name="notes" rows={3} className="field" />
            </div>
            <div>
              <label htmlFor="channel" className="label">Came in via</label>
              <select id="channel" name="channel" className="field" defaultValue="whatsapp">
                <option value="whatsapp">WhatsApp / phone</option>
                <option value="website">Website</option>
              </select>
            </div>
          </div>
        </section>
        <div className="rounded-[20px] bg-g9 p-4">
          {state?.error && <p className="mb-3 rounded-[10px] bg-white px-3 py-2 text-sm font-semibold text-danger" role="alert">{state.error}</p>}
          <button className="btn-lime h-12 w-full text-base" disabled={pending}>{pending ? "Saving…" : "Save order"}</button>
        </div>
      </div>
    </form>
  );
}
