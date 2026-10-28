"use client";

import { useActionState, useState } from "react";
import { updateOrderAction } from "../../../actions";
import { useSubmit } from "@/components/useSubmit";

const STEPS = [
  { v: "new", l: "New", d: "Not handled yet" },
  { v: "contacted", l: "Contacted", d: "You've reached out" },
  { v: "confirmed", l: "Confirmed", d: "Customer confirmed" },
  { v: "delivered", l: "Delivered", d: "Done" },
  { v: "cancelled", l: "Cancelled", d: "Won't go ahead" },
];

export function OrderStatusForm({ id, status, adminNote }: { id: number; status: string; adminNote: string }) {
  const [state, action, pending] = useActionState(updateOrderAction, undefined);
  const [value, setValue] = useState(status);
  const onSubmit = useSubmit(action);
  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-4">
      <input type="hidden" name="id" value={id} />
      <fieldset>
        <legend className="sr-only">Status</legend>
        <div className="grid gap-2">
          {STEPS.map((s) => (
            <label
              key={s.v}
              className={`flex cursor-pointer items-center gap-3 rounded-[12px] border-[1.5px] px-3 py-2.5 transition ${
                value === s.v ? "border-g9 bg-mint" : "border-line hover:border-g7"
              }`}
            >
              <input type="radio" name="status" value={s.v} checked={value === s.v} onChange={() => setValue(s.v)} className="h-4 w-4 accent-g9" />
              <span className="font-semibold">{s.l}</span>
              <span className="ml-auto text-xs text-muted">{s.d}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="admin_note" className="label">Private note</label>
        <textarea id="admin_note" name="admin_note" defaultValue={adminNote} rows={3} className="field" placeholder="Delivery fee agreed, paid via M-Pesa, rider details…" />
      </div>
      {state?.error && <p className="text-sm font-semibold text-danger">{state.error}</p>}
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Save"}</button>
        {state?.ok && !pending && <span className="text-sm font-semibold text-g7" role="status">✓ {state.ok}</span>}
      </div>
    </form>
  );
}
