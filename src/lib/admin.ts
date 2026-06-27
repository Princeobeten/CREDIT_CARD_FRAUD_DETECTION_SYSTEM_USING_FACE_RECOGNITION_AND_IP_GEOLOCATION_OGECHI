import "server-only";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Transaction } from "@/lib/models/Transaction";
import { FraudAlert } from "@/lib/models/FraudAlert";
import { AuditLog } from "@/lib/models/AuditLog";
import type { Role } from "@/lib/types";

export interface UserAdminDTO {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  byRole: Record<Role, number>;
  totalTransactions: number;
  totalAlerts: number;
}

export interface AuditDTO {
  id: string;
  action: string;
  target: string | null;
  actorName: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

export async function listUsers(): Promise<UserAdminDTO[]> {
  await connectToDatabase();
  const users = await User.find({}).sort({ createdAt: -1 }).lean();
  return users.map((u) => ({
    id: String(u._id),
    fullName: u.fullName,
    email: u.email,
    role: u.role as Role,
    createdAt: (u.createdAt as Date).toISOString(),
  }));
}

export async function getAdminStats(): Promise<AdminStats> {
  await connectToDatabase();
  const [roleAgg, totalTransactions, totalAlerts] = await Promise.all([
    User.aggregate<{ _id: Role; n: number }>([{ $group: { _id: "$role", n: { $sum: 1 } } }]),
    Transaction.countDocuments({}),
    FraudAlert.countDocuments({}),
  ]);
  const byRole: Record<Role, number> = { cardholder: 0, analyst: 0, admin: 0 };
  let totalUsers = 0;
  for (const r of roleAgg) {
    if (r._id in byRole) byRole[r._id] = r.n;
    totalUsers += r.n;
  }
  return { totalUsers, byRole, totalTransactions, totalAlerts };
}

export async function listAuditLogs(limit = 100): Promise<AuditDTO[]> {
  await connectToDatabase();
  const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(limit).lean();
  const actorIds = logs.map((l) => l.actorId).filter(Boolean);
  const actors = await User.find({ _id: { $in: actorIds } }).lean();
  const actorMap = new Map(actors.map((a) => [String(a._id), a.fullName]));
  return logs.map((l) => ({
    id: String(l._id),
    action: l.action,
    target: l.target ?? null,
    actorName: l.actorId ? (actorMap.get(String(l.actorId)) ?? "Unknown") : "System",
    meta: (l.meta as Record<string, unknown>) ?? {},
    createdAt: (l.createdAt as Date).toISOString(),
  }));
}
