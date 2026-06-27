import "server-only";
import { Schema, model, models, Types, type Model, type InferSchemaType } from "mongoose";

// A single transaction and the full multi-layer fraud assessment attached to it.
// Mirrors the workflow in Figure 3.8: ML score -> (face check) -> (geo check) -> composite.
const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // --- transaction attributes (inputs) ---
    amount: { type: Number, required: true },
    merchantCategory: { type: String, required: true },
    occurredAt: { type: Date, required: true },
    ip: { type: String, default: null },

    // --- geolocation (Module 4) ---
    geoCountry: { type: String, default: null },
    geoCity: { type: String, default: null },
    geoLat: { type: Number, default: null },
    geoLng: { type: Number, default: null },

    // --- per-layer scores (0..1) ---
    mlScore: { type: Number, required: true }, // behavioural anomaly probability
    faceChecked: { type: Boolean, default: false },
    faceMatched: { type: Boolean, default: null }, // null = not run
    faceDistance: { type: Number, default: null }, // Euclidean distance at verification
    faceScore: { type: Number, default: 0 }, // risk contribution
    geoScore: { type: Number, default: 0 }, // risk contribution

    // --- aggregate (Module 5) ---
    compositeScore: { type: Number, required: true },
    decision: { type: String, enum: ["approved", "rejected", "review"], required: true },
    reasons: { type: [String], default: [] },
  },
  { timestamps: true },
);

transactionSchema.index({ userId: 1, occurredAt: -1 });

export type TransactionDoc = InferSchemaType<typeof transactionSchema> & { _id: Types.ObjectId };

export const Transaction: Model<TransactionDoc> =
  (models.Transaction as Model<TransactionDoc>) ??
  model<TransactionDoc>("Transaction", transactionSchema);
