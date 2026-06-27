import "server-only";
import { Schema, model, models, Types, type Model, type InferSchemaType } from "mongoose";

// A cardholder's registered card + their "home" geographic profile.
// We never store a full PAN — only the masked last 4 digits (prototype scope).
const cardSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    last4: { type: String, required: true },
    brand: { type: String, default: "unknown" },
    expiry: { type: String, required: true }, // MM/YY
    homeCountry: { type: String, required: true }, // ISO-2, e.g. "NG"
    homeCity: { type: String, default: null },
    homeLat: { type: Number, default: null },
    homeLng: { type: Number, default: null },
  },
  { timestamps: true },
);

export type CardDoc = InferSchemaType<typeof cardSchema> & { _id: Types.ObjectId };

export const Card: Model<CardDoc> =
  (models.Card as Model<CardDoc>) ?? model<CardDoc>("Card", cardSchema);
