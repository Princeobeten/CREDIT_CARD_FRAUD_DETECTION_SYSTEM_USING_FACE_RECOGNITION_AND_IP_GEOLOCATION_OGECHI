import "server-only";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Role } from "@/lib/types";

const SESSION_COOKIE = "session";
const key = () => new TextEncoder().encode(env.sessionSecret);

export interface SessionClaims extends JWTPayload {
  userId: string;
  role: Role;
}

export async function encrypt(payload: { userId: string; role: Role }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key());
}

export async function decrypt(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (typeof payload.userId === "string" && typeof payload.role === "string") {
      return payload as SessionClaims;
    }
    return null;
  } catch {
    return null;
  }
}

export async function createSession(userId: string, role: Role): Promise<void> {
  const token = await encrypt({ userId, role });
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const store = await cookies(); // cookies() is async in Next.js 16
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function deleteSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function readSessionCookie(): Promise<SessionClaims | null> {
  const store = await cookies();
  return decrypt(store.get(SESSION_COOKIE)?.value);
}

export { SESSION_COOKIE };
