import "server-only";
import type { GeoLocation } from "@/lib/types";
import type { RiskConfig } from "@/lib/constants";

export interface PriorLocation {
  country: string | null;
  lat: number | null;
  lng: number | null;
  occurredAt: Date;
}

export interface GeoRiskResult {
  geoScore: number; // 0..1
  reasons: string[];
}

// Great-circle distance between two coordinates, in kilometres.
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

// Assesses geospatial risk for a transaction against the cardholder's home
// country and their most recent prior transaction (for impossible-travel).
export function assessGeoRisk(
  current: GeoLocation,
  currentOccurredAt: Date,
  homeCountry: string | null,
  prior: PriorLocation | null,
  config: RiskConfig,
): GeoRiskResult {
  const reasons: string[] = [];
  let score = 0;

  if (!current.country) {
    // Could not geolocate (e.g. localhost). Neutral, low signal.
    return { geoScore: 0, reasons: ["Originating location could not be determined"] };
  }

  // High-risk jurisdiction.
  if (config.highRiskCountries.includes(current.country)) {
    score += 0.6;
    reasons.push(`Transaction originates from a high-risk country (${current.country})`);
  }

  // New country vs the cardholder's home.
  if (homeCountry && current.country !== homeCountry) {
    score += 0.3;
    reasons.push(`Country (${current.country}) differs from home country (${homeCountry})`);
  }

  // Impossible travel vs the previous transaction.
  if (prior && prior.lat != null && prior.lng != null && current.lat != null && current.lng != null) {
    const km = haversineKm(prior.lat, prior.lng, current.lat, current.lng);
    const hours = Math.max(
      (currentOccurredAt.getTime() - prior.occurredAt.getTime()) / 3_600_000,
      1 / 60, // floor at 1 minute to avoid divide-by-zero
    );
    const speed = km / hours;
    if (km > 100 && speed > config.impossibleTravelKmh) {
      score += 0.7;
      reasons.push(
        `Impossible travel: ${Math.round(km)} km from the previous transaction in ${
          hours < 1 ? `${Math.round(hours * 60)} min` : `${hours.toFixed(1)} h`
        }`,
      );
    }
  }

  return { geoScore: Math.min(1, score), reasons };
}
