"use client";

import { startTransition } from "react";

/**
 * Submit a form to a useActionState action without React's automatic form reset,
 * so typed values stay put when the server returns a validation error.
 */
export function useSubmit(action: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
}
