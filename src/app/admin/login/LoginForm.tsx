"use client";

import { useActionState, useState } from "react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="password" className="label">Password</label>
        <div className="relative">
          <input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required autoFocus className="field pr-16" aria-invalid={!!state?.error} aria-describedby={state?.error ? "login-err" : undefined} />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-bold text-g7 hover:bg-mint">
            {show ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      {state?.error && <p id="login-err" className="text-sm font-semibold text-danger" role="alert">{state.error}</p>}
      <button className="btn-primary h-12 w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
