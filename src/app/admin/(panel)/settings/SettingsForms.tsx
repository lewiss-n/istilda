"use client";

import { useActionState } from "react";
import type { PublicSettings } from "@/lib/settings";
import { changePasswordAction, saveSettingsAction } from "../../actions";
import { useSubmit } from "@/components/useSubmit";

function Field({ id, label, hint, defaultValue, error, textarea, ...rest }: { id: string; label: string; hint?: string; defaultValue: string; error?: string; textarea?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      {textarea ? (
        <textarea id={id} name={id} defaultValue={defaultValue} rows={2} className="field" />
      ) : (
        <input id={id} name={id} defaultValue={defaultValue} className="field" {...rest} />
      )}
      {error ? <p className="mt-1 text-sm text-danger">{error}</p> : hint && <p className="mt-1 text-[13px] text-muted">{hint}</p>}
    </div>
  );
}

export function SettingsForm({ settings }: { settings: PublicSettings }) {
  const [state, action, pending] = useActionState(saveSettingsAction, undefined);
  const onSubmit = useSubmit(action);
  const fe = state?.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="rounded-[20px] bg-white p-5 ring-1 ring-line/70 sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-g9">WhatsApp ordering</h2>
        <div className="mt-4">
          <Field
            id="whatsapp_number"
            label="Your WhatsApp number"
            defaultValue={settings.whatsapp_number}
            inputMode="tel"
            placeholder="254712345678"
            hint="Customers' WhatsApp orders and questions go to this number. Use the international format without + or spaces. Leave empty to hide all WhatsApp buttons."
            error={fe.whatsapp_number}
          />
        </div>
      </section>
      <section className="rounded-[20px] bg-white p-5 ring-1 ring-line/70 sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-g9">Shown on the store</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field id="contact_phone" label="Contact phone" defaultValue={settings.contact_phone} inputMode="tel" />
          <Field id="contact_email" label="Contact email" defaultValue={settings.contact_email} type="email" />
          <Field id="instagram" label="Instagram handle" defaultValue={settings.instagram} placeholder="@istildaimporters" />
          <Field id="location_text" label="Location" defaultValue={settings.location_text} />
        </div>
        <div className="mt-4 space-y-4">
          <Field id="announcement" label="Announcement bar" defaultValue={settings.announcement} hint="The green strip at the very top of the store. Leave empty to hide it." textarea />
          <Field id="delivery_text" label="Delivery information" defaultValue={settings.delivery_text} hint="Shown on product pages, at checkout and in the footer." textarea />
        </div>
      </section>
      <div className="flex items-center gap-3">
        <button className="btn-primary" disabled={pending}>{pending ? "Saving…" : "Save settings"}</button>
        {state?.ok && !pending && <span className="text-sm font-semibold text-g7" role="status">✓ {state.ok}</span>}
        {state?.error && <span className="text-sm font-semibold text-danger" role="alert">{state.error}</span>}
      </div>
    </form>
  );
}

export function PasswordForm({ locked = false }: { locked?: boolean }) {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  if (locked) {
    return (
      <section className="h-fit rounded-[20px] bg-white p-5 ring-1 ring-line/70 sm:p-6">
        <h2 className="font-display text-lg font-extrabold text-g9">Admin password</h2>
        <p className="mt-2 text-sm text-muted">
          This is a demo, so the password can&apos;t be changed here. It&apos;s set by <code className="font-mono">ADMIN_PASSWORD</code> in the hosting settings.
        </p>
      </section>
    );
  }
  return (
    <form action={action} className="h-fit rounded-[20px] bg-white p-5 ring-1 ring-line/70 sm:p-6">
      <h2 className="font-display text-lg font-extrabold text-g9">Change admin password</h2>
      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="current" className="label">Current password</label>
          <input id="current" name="current" type="password" autoComplete="current-password" required className="field" />
        </div>
        <div>
          <label htmlFor="next" className="label">New password</label>
          <input id="next" name="next" type="password" autoComplete="new-password" minLength={10} required className="field" />
          <p className="mt-1 text-[13px] text-muted">At least 10 characters.</p>
        </div>
        <div>
          <label htmlFor="confirm" className="label">Repeat new password</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="field" />
        </div>
      </div>
      {state?.error && <p className="mt-3 text-sm font-semibold text-danger" role="alert">{state.error}</p>}
      {state?.ok && <p className="mt-3 text-sm font-semibold text-g7" role="status">✓ {state.ok}</p>}
      <button className="btn-outline mt-4" disabled={pending}>{pending ? "Saving…" : "Change password"}</button>
    </form>
  );
}
