"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/dal";
import { connectToDatabase } from "@/lib/db";
import { Card } from "@/lib/models/Card";
import { BiometricTemplate } from "@/lib/models/BiometricTemplate";

const cardSchema = z.object({
  last4: z.string().regex(/^\d{4}$/, "Enter the last 4 digits of the card"),
  brand: z.string().trim().min(1, "Select a card brand"),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY format"),
  homeCountry: z
    .string()
    .trim()
    .regex(/^[A-Za-z]{2}$/, "Use a 2-letter country code (e.g. NG)"),
  homeCity: z.string().trim().optional().nullable(),
});

export type EnrollInput = z.input<typeof cardSchema>;

export interface EnrollResult {
  ok: boolean;
  error?: string;
}

function isValidDescriptor(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === 128 &&
    value.every((n) => typeof n === "number" && Number.isFinite(n))
  );
}

export async function enrollCardholder(
  input: EnrollInput,
  descriptor: number[],
): Promise<EnrollResult> {
  // Re-verify auth + role INSIDE the action — page gating does not protect actions.
  const session = await requireRole("cardholder");

  const parsed = cardSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid card details";
    return { ok: false, error: first };
  }

  if (!isValidDescriptor(descriptor)) {
    return { ok: false, error: "Face capture is missing or invalid. Please capture your face." };
  }

  await connectToDatabase();

  await Card.findOneAndUpdate(
    { userId: session.userId },
    {
      userId: session.userId,
      last4: parsed.data.last4,
      brand: parsed.data.brand,
      expiry: parsed.data.expiry,
      homeCountry: parsed.data.homeCountry.toUpperCase(),
      homeCity: parsed.data.homeCity || null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await BiometricTemplate.findOneAndUpdate(
    { userId: session.userId },
    { userId: session.userId, descriptor },
    { upsert: true, new: true },
  );

  revalidatePath("/cardholder");
  return { ok: true };
}
