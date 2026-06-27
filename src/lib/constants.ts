// Plain shared constants and default tuning parameters.
// No secrets, no DB, no server-only APIs — safe to import from client or server.

import type { AlertSeverity, AlertStatus } from "@/lib/types";

export const ALERT_SEVERITIES: readonly AlertSeverity[] = ["low", "medium", "high"] as const;
export const ALERT_STATUSES: readonly AlertStatus[] = [
  "open",
  "reviewing",
  "resolved",
  "dismissed",
] as const;

// Merchant categories offered on the transaction form (and used as an ML feature).
export const MERCHANT_CATEGORIES = [
  "groceries",
  "electronics",
  "travel",
  "fuel",
  "restaurants",
  "online_services",
  "jewellery",
  "gambling",
  "cash_advance",
  "money_transfer",
] as const;
export type MerchantCategory = (typeof MERCHANT_CATEGORIES)[number];

// Default risk-scoring configuration. The admin can override these (SystemConfig doc),
// but these defaults are used when no override exists.
export const DEFAULT_CONFIG = {
  // Weighted aggregation of the three layers (must sum to 1).
  weights: { ml: 0.5, face: 0.3, geo: 0.2 },

  // If the ML behavioural score >= this, escalate to face + geo verification.
  mlEscalationThreshold: 0.5,

  // Composite-score decision bands.
  rejectThreshold: 0.7, // >= reject
  reviewThreshold: 0.4, // >= flag for analyst review, else approve

  // face-api.js descriptor distance: <= this is considered a match (lower = stricter).
  faceMatchDistance: 0.55,

  // Geolocation risk.
  highRiskCountries: ["KP", "IR", "SY"] as string[],
  // Speed (km/h) above which two consecutive transactions imply "impossible travel".
  impossibleTravelKmh: 900,
} as const;

export type RiskConfig = {
  weights: { ml: number; face: number; geo: number };
  mlEscalationThreshold: number;
  rejectThreshold: number;
  reviewThreshold: number;
  faceMatchDistance: number;
  highRiskCountries: string[];
  impossibleTravelKmh: number;
};
