// Shared domain types for the Credit Card Fraud Detection System.
// Safe to import from both server and client code (no secrets, no DB access).

export const ROLES = ["cardholder", "analyst", "admin"] as const;
export type Role = (typeof ROLES)[number];

export type TransactionDecision = "approved" | "rejected" | "review";

export type AlertSeverity = "low" | "medium" | "high";
export type AlertStatus = "open" | "reviewing" | "resolved" | "dismissed";

// The minimal payload we put inside the signed session JWT.
export interface SessionPayload {
  userId: string;
  role: Role;
  expiresAt: Date;
}

// Result of a per-request auth check (returned by the DAL).
export interface Session {
  isAuth: true;
  userId: string;
  role: Role;
}

// Where a request appears to originate, derived from its IP.
export interface GeoLocation {
  ip: string;
  country: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
}

// Output of the three independent detection layers + the aggregated score.
export interface RiskBreakdown {
  mlScore: number; // 0..1 behavioural fraud probability (logistic regression)
  faceScore: number; // 0..1 risk contribution from face check (1 = mismatch/skipped-fail)
  geoScore: number; // 0..1 geospatial risk contribution
  compositeScore: number; // 0..1 weighted aggregate
  decision: TransactionDecision;
  reasons: string[];
}

// Per-cardholder dashboard home route, keyed by role.
export const HOME_BY_ROLE: Record<Role, string> = {
  cardholder: "/cardholder",
  analyst: "/analyst",
  admin: "/admin",
};
