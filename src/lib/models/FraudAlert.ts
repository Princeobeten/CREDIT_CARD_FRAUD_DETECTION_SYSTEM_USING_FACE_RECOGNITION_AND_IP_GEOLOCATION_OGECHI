import "server-only";
import { Schema, model, models, Types, type Model, type InferSchemaType } from "mongoose";
import { ALERT_SEVERITIES, ALERT_STATUSES } from "@/lib/constants";

// Module 6 — Fraud Alert & Reporting. Raised when a transaction is rejected or
// flagged for review; worked by the bank fraud analyst.
const fraudAlertSchema = new Schema(
  {
    transactionId: { type: Schema.Types.ObjectId, ref: "Transaction", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    reason: { type: String, required: true },
    severity: { type: String, enum: ALERT_SEVERITIES, required: true },
    status: { type: String, enum: ALERT_STATUSES, required: true, default: "open", index: true },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewNote: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type FraudAlertDoc = InferSchemaType<typeof fraudAlertSchema> & { _id: Types.ObjectId };

export const FraudAlert: Model<FraudAlertDoc> =
  (models.FraudAlert as Model<FraudAlertDoc>) ??
  model<FraudAlertDoc>("FraudAlert", fraudAlertSchema);
