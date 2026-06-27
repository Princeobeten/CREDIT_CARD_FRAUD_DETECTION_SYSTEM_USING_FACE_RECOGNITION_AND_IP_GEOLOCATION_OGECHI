import "server-only";
import { env } from "@/lib/env";
import type { GeoLocation } from "@/lib/types";

const UNKNOWN = (ip: string): GeoLocation => ({
  ip: ip || "unknown",
  country: null,
  city: null,
  lat: null,
  lng: null,
});

export function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === "::1" || ip.startsWith("127.") || ip === "localhost") return true;
  if (ip.startsWith("10.") || ip.startsWith("192.168.")) return true;
  // 172.16.0.0 – 172.31.255.255
  const m = ip.match(/^172\.(\d+)\./);
  if (m) {
    const second = Number(m[1]);
    if (second >= 16 && second <= 31) return true;
  }
  // IPv6 unique-local / link-local
  if (ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) return true;
  return false;
}

// Extracts the originating client IP from request headers (Vercel/proxies set
// x-forwarded-for). Falls back through common headers.
export function clientIpFromHeaders(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? "";
}

// Looks up an IP via ipapi.co (free tier, no key). Returns nulls for private/local
// IPs or on any failure — geolocation is best-effort and must never block scoring.
export async function geolocateIp(ip: string): Promise<GeoLocation> {
  if (isPrivateIp(ip)) return UNKNOWN(ip);
  try {
    const res = await fetch(`${env.geoApiBase}/${encodeURIComponent(ip)}/json/`, {
      headers: { "User-Agent": "FraudGuard/1.0 (prototype)" },
      cache: "no-store",
    });
    if (!res.ok) return UNKNOWN(ip);
    const data = (await res.json()) as {
      country_code?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
      error?: boolean;
    };
    if (data.error) return UNKNOWN(ip);
    return {
      ip,
      country: data.country_code ?? null,
      city: data.city ?? null,
      lat: typeof data.latitude === "number" ? data.latitude : null,
      lng: typeof data.longitude === "number" ? data.longitude : null,
    };
  } catch {
    return UNKNOWN(ip);
  }
}
