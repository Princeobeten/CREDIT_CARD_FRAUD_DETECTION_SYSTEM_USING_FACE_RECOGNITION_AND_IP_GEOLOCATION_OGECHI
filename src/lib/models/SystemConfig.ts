import "server-only";
import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

// Admin-tunable risk parameters (Module: System Administrator -> Configure Risk Thresholds).
// Stored as a single document; the `key` field enforces the singleton.
const systemConfigSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    weightMl: { type: Number, required: true },
    weightFace: { type: Number, required: true },
    weightGeo: { type: Number, required: true },
    mlEscalationThreshold: { type: Number, required: true },
    rejectThreshold: { type: Number, required: true },
    reviewThreshold: { type: Number, required: true },
    faceMatchDistance: { type: Number, required: true },
    highRiskCountries: { type: [String], default: [] },
    impossibleTravelKmh: { type: Number, required: true },
  },
  { timestamps: true },
);

export type SystemConfigDoc = InferSchemaType<typeof systemConfigSchema>;

export const SystemConfig: Model<SystemConfigDoc> =
  (models.SystemConfig as Model<SystemConfigDoc>) ??
  model<SystemConfigDoc>("SystemConfig", systemConfigSchema);
