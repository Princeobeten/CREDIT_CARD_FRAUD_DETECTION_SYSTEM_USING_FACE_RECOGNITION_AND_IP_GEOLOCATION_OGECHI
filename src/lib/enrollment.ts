import "server-only";
import { connectToDatabase } from "@/lib/db";
import { Card } from "@/lib/models/Card";
import { BiometricTemplate } from "@/lib/models/BiometricTemplate";

export interface EnrollmentStatus {
  hasCard: boolean;
  hasFace: boolean;
  card: {
    last4: string;
    brand: string;
    expiry: string;
    homeCountry: string;
    homeCity: string | null;
  } | null;
}

export async function getEnrollment(userId: string): Promise<EnrollmentStatus> {
  await connectToDatabase();
  const [card, face] = await Promise.all([
    Card.findOne({ userId }).lean(),
    BiometricTemplate.exists({ userId }),
  ]);
  return {
    hasCard: card != null,
    hasFace: face != null,
    card: card
      ? {
          last4: card.last4,
          brand: card.brand,
          expiry: card.expiry,
          homeCountry: card.homeCountry,
          homeCity: card.homeCity ?? null,
        }
      : null,
  };
}

// The stored 128-d descriptor for a user (used by face verification in Phase 3).
export async function getFaceDescriptor(userId: string): Promise<number[] | null> {
  await connectToDatabase();
  const tpl = await BiometricTemplate.findOne({ userId }).lean();
  return tpl?.descriptor ?? null;
}
