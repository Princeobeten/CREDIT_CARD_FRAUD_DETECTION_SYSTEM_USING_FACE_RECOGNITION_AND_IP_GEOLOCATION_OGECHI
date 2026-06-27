"use client";

import { useActionState } from "react";
import { registerAction } from "@/lib/actions/auth";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

export default function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, undefined);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
          Full name
        </label>
        <input id="fullName" name="fullName" type="text" autoComplete="name" className={inputCls} />
        {state?.errors?.fullName && (
          <p className="mt-1 text-sm text-red-600">{state.errors.fullName[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" className={inputCls} />
        {state?.errors?.email && (
          <p className="mt-1 text-sm text-red-600">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className={inputCls}
        />
        {state?.errors?.password && (
          <p className="mt-1 text-sm text-red-600">{state.errors.password[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="role" className="mb-1 block text-sm font-medium">
          Account type
        </label>
        <select id="role" name="role" defaultValue="cardholder" className={inputCls}>
          <option value="cardholder">Cardholder</option>
          <option value="analyst">Bank Fraud Analyst</option>
          <option value="admin">System Administrator</option>
        </select>
        <p className="mt-1 text-xs text-muted">
          Demo convenience — in production, roles are assigned by an administrator.
        </p>
        {state?.errors?.role && (
          <p className="mt-1 text-sm text-red-600">{state.errors.role[0]}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
