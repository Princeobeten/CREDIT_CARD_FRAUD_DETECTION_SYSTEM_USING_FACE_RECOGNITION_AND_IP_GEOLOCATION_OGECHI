import "server-only";
import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

// The enrolled facial biometric: a 128-dimension descriptor produced by face-api.js
// at enrollment. Verification compares a fresh descriptor against this one by
// Euclidean distance. One template per cardholder.
const biometricTemplateSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    descriptor: {
      type: [Number],
      required: true,
      validate: {
        validator: (v: number[]) => Array.isArray(v) && v.length === 128,
        message: "Face descriptor must be a 128-dimension vector.",
      },
    },
  },
  { timestamps: true },
);

export type BiometricTemplateDoc = InferSchemaType<typeof biometricTemplateSchema>;

export const BiometricTemplate: Model<BiometricTemplateDoc> =
  (models.BiometricTemplate as Model<BiometricTemplateDoc>) ??
  model<BiometricTemplateDoc>("BiometricTemplate", biometricTemplateSchema);
