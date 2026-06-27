"use server";

import { z } from "zod";
import { refresh } from "next/cache";
import { requireRole } from "@/lib/dal";
import { connectToDatabase } from "@/lib/db";
import { FraudAlert } from "@/lib/models/FraudAlert";
import { AuditLog } from "@/lib/models/AuditLog";

const schema = z.object({
  alertId: z.string().min(1),
  action: z.enum(["reviewing", "resolved", "dismissed"]),
  note: z.string().trim().max(500).optional(),
});

export interface ReviewResult {
  ok: boolean;
  error?: string;
}

export async function reviewAlertAction(input: {
  alertId: string;
  action: "reviewing" | "resolved" | "dismissed";
  note?: string;
}): Promise<ReviewResult> {
  const session = await requireRole("analyst", "admin"); // re-verify inside the action

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await connectToDatabase();
  const { alertId, action, note } = parsed.data;
  const update: Record<string, unknown> = {
    status: action,
    reviewedBy: session.userId,
    reviewNote: note ?? null,
  };
  if (action === "resolved" || action === "dismissed") {
    update.resolvedAt = new Date();
  }

  const result = await FraudAlert.findByIdAndUpdate(alertId, update);
  if (!result) return { ok: false, error: "Alert not found" };

  await AuditLog.create({
    actorId: session.userId,
    action: `alert.${action}`,
    target: alertId,
    meta: { note: note ?? null },
  });

  refresh(); // refresh the client router so the analyst sees the updated status
  return { ok: true };
}
