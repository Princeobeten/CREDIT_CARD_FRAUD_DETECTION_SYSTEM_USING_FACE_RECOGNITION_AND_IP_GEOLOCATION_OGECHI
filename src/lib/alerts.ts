import "server-only";
import { connectToDatabase } from "@/lib/db";
import { FraudAlert } from "@/lib/models/FraudAlert";
import { Transaction } from "@/lib/models/Transaction";
import { User } from "@/lib/models/User";
import type { AlertSeverity, AlertStatus, TransactionDecision } from "@/lib/types";

export interface AlertDTO {
  id: string;
  reason: string;
  severity: AlertSeverity;
  status: AlertStatus;
  createdAt: string;
  reviewNote: string | null;
  // joined transaction + cardholder
  transactionId: string;
  userName: string;
  userEmail: string;
  amount: number;
  merchantCategory: string;
  compositeScore: number;
  decision: TransactionDecision;
  geoCountry: string | null;
  faceMatched: boolean | null;
  occurredAt: string;
  reasons: string[];
}

export interface AlertStats {
  openCount: number;
  highSeverityCount: number;
  totalTransactions: number;
  flaggedTransactions: number;
  rejectedTransactions: number;
  fraudRatePct: number;
}

export async function listAlerts(status?: AlertStatus): Promise<AlertDTO[]> {
  await connectToDatabase();
  const filter = status ? { status } : {};
  const alerts = await FraudAlert.find(filter).sort({ createdAt: -1 }).limit(100).lean();

  const txIds = alerts.map((a) => a.transactionId);
  const userIds = alerts.map((a) => a.userId);
  const [txs, users] = await Promise.all([
    Transaction.find({ _id: { $in: txIds } }).lean(),
    User.find({ _id: { $in: userIds } }).lean(),
  ]);
  const txMap = new Map(txs.map((t) => [t._id.toString(), t]));
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  return alerts.map((a) => {
    const tx = txMap.get(a.transactionId.toString());
    const user = userMap.get(a.userId.toString());
    return {
      id: a._id.toString(),
      reason: a.reason,
      severity: a.severity as AlertSeverity,
      status: a.status as AlertStatus,
      createdAt: (a.createdAt as Date).toISOString(),
      reviewNote: a.reviewNote ?? null,
      transactionId: a.transactionId.toString(),
      userName: user?.fullName ?? "Unknown",
      userEmail: user?.email ?? "—",
      amount: tx?.amount ?? 0,
      merchantCategory: tx?.merchantCategory ?? "—",
      compositeScore: tx?.compositeScore ?? 0,
      decision: (tx?.decision as TransactionDecision) ?? "review",
      geoCountry: tx?.geoCountry ?? null,
      faceMatched: tx?.faceMatched ?? null,
      occurredAt: tx ? tx.occurredAt.toISOString() : (a.createdAt as Date).toISOString(),
      reasons: tx?.reasons ?? [],
    };
  });
}

export async function getAlertStats(): Promise<AlertStats> {
  await connectToDatabase();
  const [openCount, highSeverityCount, totalTransactions, flaggedTransactions, rejectedTransactions] =
    await Promise.all([
      FraudAlert.countDocuments({ status: "open" }),
      FraudAlert.countDocuments({ severity: "high", status: { $in: ["open", "reviewing"] } }),
      Transaction.countDocuments({}),
      Transaction.countDocuments({ decision: { $ne: "approved" } }),
      Transaction.countDocuments({ decision: "rejected" }),
    ]);
  const fraudRatePct =
    totalTransactions > 0 ? (flaggedTransactions / totalTransactions) * 100 : 0;
  return {
    openCount,
    highSeverityCount,
    totalTransactions,
    flaggedTransactions,
    rejectedTransactions,
    fraudRatePct,
  };
}
