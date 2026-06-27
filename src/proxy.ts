import { NextResponse, type NextRequest } from "next/server";
import { decrypt } from "@/lib/session";
import { HOME_BY_ROLE } from "@/lib/types";

// Next.js 16 "Proxy" (formerly Middleware). OPTIMISTIC, cookie-only gate — no DB here.
// It just redirects unauthenticated users away from protected areas and authenticated
// users away from the auth pages. Authoritative role checks happen in pages/actions
// via requireRole() in the DAL.

const AUTH_REQUIRED_PREFIXES = ["/cardholder", "/analyst", "/admin"];
const AUTH_PAGES = ["/login", "/register"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("session")?.value;
  const session = await decrypt(token);

  const needsAuth = AUTH_REQUIRED_PREFIXES.some((p) => pathname.startsWith(p));
  if (needsAuth && !session) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.includes(pathname) && session) {
    return NextResponse.redirect(new URL(HOME_BY_ROLE[session.role], req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  // Skip API routes, Next internals, and any file with an extension (static assets,
  // including the face-api model files served from /public).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
