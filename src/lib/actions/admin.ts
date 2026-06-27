"use server";

import { z } from "zod";
import { refresh } from "next/cache";
import { requireRole } from "@/lib/dal";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { AuditLog } from "@/lib/models/AuditLog";
import { saveRiskConfig } from "@/lib/config";
import { ROLES, type Role } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function changeUserRoleAction(input: {
  userId: string;
  role: Role;
}): Promise<ActionResult> {
  const session = await requireRole("admin");
  const schema = z.object({ userId: z.string().min(1), role: z.enum(ROLES) });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };

  await connectToDatabase();
  const updated = await User.findByIdAndUpdate(parsed.data.userId, { role: parsed.data.role });
  if (!updated) return { ok: false, error: "User not found" };

  await AuditLog.create({
    actorId: session.userId,
    action: "user.role_changed",
    target: parsed.data.userId,
    meta: { from: updated.role, to: parsed.data.role },
  });

  refresh();
  return { ok: true };
}

const configSchema = z.object({
  weightMl: z.number().min(0).max(1),
  weightFace: z.number().min(0).max(1),
  weightGeo: z.number().min(0).max(1),
  mlEscalationThreshold: z.number().min(0).max(1),
  rejectThreshold: z.number().min(0).max(1),
  reviewThreshold: z.number().min(0).max(1),
  faceMatchDistance: z.number().min(0.1).max(1.5),
  impossibleTravelKmh: z.number().min(1).max(100000),
  highRiskCountries: z.string().max(500),
});

export async function updateRiskConfigAction(input: {
  weightMl: number;
  weightFace: number;
  weightGeo: number;
  mlEscalationThreshold: number;
  rejectThreshold: number;
  reviewThreshold: number;
  faceMatchDistance: number;
  impossibleTravelKmh: number;
  highRiskCountries: string;
}): Promise<ActionResult> {
  const session = await requireRole("admin");
  const parsed = configSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid configuration" };
  }
  const d = parsed.data;

  if (d.reviewThreshold > d.rejectThreshold) {
    return { ok: false, error: "Review threshold cannot exceed reject threshold" };
  }

  // Normalise the three weights to sum to 1.
  const sum = d.weightMl + d.weightFace + d.weightGeo;
  if (sum <= 0) return { ok: false, error: "Weights must sum to a positive value" };

  const countries = d.highRiskCountries
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{2}$/.test(c));

  await saveRiskConfig({
    weights: { ml: d.weightMl / sum, face: d.weightFace / sum, geo: d.weightGeo / sum },
    mlEscalationThreshold: d.mlEscalationThreshold,
    rejectThreshold: d.rejectThreshold,
    reviewThreshold: d.reviewThreshold,
    faceMatchDistance: d.faceMatchDistance,
    impossibleTravelKmh: d.impossibleTravelKmh,
    highRiskCountries: countries,
  });

  await AuditLog.create({
    actorId: session.userId,
    action: "config.updated",
    target: "global",
    meta: { ...d, normalizedWeights: { ml: d.weightMl / sum, face: d.weightFace / sum, geo: d.weightGeo / sum } },
  });

  refresh();
  return { ok: true };
}
