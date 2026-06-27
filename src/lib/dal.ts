import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSessionCookie } from "@/lib/session";
import type { Role, Session } from "@/lib/types";

// The authoritative per-request auth check. Proxy is only an optimistic gate;
// real authorization happens here (and inside every Server Action / Route Handler).
// Wrapped in React cache() so repeated calls in one request decrypt the cookie once.

export const getSession = cache(async (): Promise<Session | null> => {
  const claims = await readSessionCookie();
  if (!claims?.userId) return null;
  return { isAuth: true, userId: claims.userId, role: claims.role };
});

// Use in Server Components / pages: redirects to /login if unauthenticated.
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

// Use when a specific role is required. Redirects unauthenticated users to /login
// and authenticated-but-wrong-role users to /403.
export async function requireRole(...allowed: Role[]): Promise<Session> {
  const session = await requireSession();
  if (!allowed.includes(session.role)) redirect("/403");
  return session;
}
