import "server-only";
import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

// System Administrator -> System Audit and Logs. Append-only record of sensitive actions.
const auditLogSchema = new Schema(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true }, // e.g. "user.role_changed", "config.updated"
    target: { type: String, default: null }, // id or label the action affected
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type AuditLogDoc = InferSchemaType<typeof auditLogSchema>;

export const AuditLog: Model<AuditLogDoc> =
  (models.AuditLog as Model<AuditLogDoc>) ?? model<AuditLogDoc>("AuditLog", auditLogSchema);
