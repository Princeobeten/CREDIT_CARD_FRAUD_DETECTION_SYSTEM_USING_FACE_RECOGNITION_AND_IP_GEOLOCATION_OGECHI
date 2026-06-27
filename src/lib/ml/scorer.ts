// Pure logistic-regression scorer. No DB, no secrets — importable anywhere
// (the Phase 8 notebook mirrors this exact maths in Python for parity).

import {
  FEATURE_NAMES,
  INTERCEPT,
  WEIGHTS,
  STANDARDIZATION,
  type FeatureName,
} from "@/lib/ml/coefficients";
import type { FeatureVector } from "@/lib/ml/features";

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

export interface MlScoreResult {
  probability: number; // 0..1 fraud probability
  contributions: { feature: FeatureName; contribution: number }[]; // signed logit contributions
  topReasons: string[];
}

const REASON_TEXT: Record<FeatureName, string> = {
  amountLog: "Unusually large transaction amount",
  amountRatio: "Amount far above the cardholder's typical spend",
  isNight: "Transaction occurred during late-night hours",
  categoryRisk: "High-risk merchant category",
  velocity1h: "Rapid succession of recent transactions",
  newCategory: "First-time merchant category for this cardholder",
};

export function scoreFeatures(features: FeatureVector): MlScoreResult {
  let logit = INTERCEPT;
  const contributions: { feature: FeatureName; contribution: number }[] = [];

  for (const name of FEATURE_NAMES) {
    const { mean, std } = STANDARDIZATION[name];
    const z = (features[name] - mean) / (std || 1);
    const contribution = WEIGHTS[name] * z;
    logit += contribution;
    contributions.push({ feature: name, contribution });
  }

  const probability = sigmoid(logit);

  // Surface the strongest positive (risk-increasing) drivers.
  const topReasons = contributions
    .filter((c) => c.contribution > 0.25)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 3)
    .map((c) => REASON_TEXT[c.feature]);

  return { probability, contributions, topReasons };
}
