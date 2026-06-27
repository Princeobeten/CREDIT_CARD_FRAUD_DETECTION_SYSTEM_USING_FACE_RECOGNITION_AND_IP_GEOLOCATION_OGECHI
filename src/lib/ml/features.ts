import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Transaction } from "@/lib/models/Transaction";
import { CATEGORY_RISK, DEFAULT_CATEGORY_RISK, type FeatureName } from "@/lib/ml/coefficients";

export type FeatureVector = Record<FeatureName, number>;

export interface TransactionInput {
  amount: number;
  merchantCategory: string;
  occurredAt: Date;
}

// Cardholder behavioural context derived from transaction history.
interface FeatureContext {
  avgAmount: number;
  txCountLast1h: number;
  isNewCategory: boolean;
}

async function buildContext(userId: string, input: TransactionInput): Promise<FeatureContext> {
  await connectToDatabase();
  const uid = new Types.ObjectId(userId);
  const since = new Date(input.occurredAt.getTime() - 60 * 60 * 1000);

  const [agg, count1h, catCount] = await Promise.all([
    Transaction.aggregate<{ avg: number }>([
      { $match: { userId: uid } },
      { $group: { _id: null, avg: { $avg: "$amount" } } },
    ]),
    Transaction.countDocuments({ userId: uid, occurredAt: { $gte: since, $lt: input.occurredAt } }),
    Transaction.countDocuments({ userId: uid, merchantCategory: input.merchantCategory }),
  ]);

  return {
    avgAmount: agg[0]?.avg ?? 80, // prior for a brand-new cardholder
    txCountLast1h: count1h,
    isNewCategory: catCount === 0,
  };
}

// Pure feature computation (also used by the Phase 8 notebook's data generator).
export function computeFeatures(input: TransactionInput, ctx: FeatureContext): FeatureVector {
  const hour = input.occurredAt.getHours();
  return {
    amountLog: Math.log(1 + Math.max(0, input.amount)),
    amountRatio: input.amount / Math.max(ctx.avgAmount, 1),
    isNight: hour >= 0 && hour < 6 ? 1 : 0,
    categoryRisk: CATEGORY_RISK[input.merchantCategory] ?? DEFAULT_CATEGORY_RISK,
    velocity1h: ctx.txCountLast1h,
    newCategory: ctx.isNewCategory ? 1 : 0,
  };
}

export async function extractFeatures(
  userId: string,
  input: TransactionInput,
): Promise<FeatureVector> {
  const ctx = await buildContext(userId, input);
  return computeFeatures(input, ctx);
}
