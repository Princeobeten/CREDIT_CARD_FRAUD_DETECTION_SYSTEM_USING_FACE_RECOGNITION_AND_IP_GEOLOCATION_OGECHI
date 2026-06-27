// Logistic-regression parameters for the transaction anomaly model.
//
// The live app scores INTERPRETABLE features it can compute at inference time
// (a deployable model can't reproduce the Kaggle dataset's anonymized V1..V28).
// These coefficients are hand-calibrated for sensible prototype behaviour; the
// Phase 8 Colab notebook trains a logistic regression on the same feature schema
// and its exported (intercept, weights, standardization) values replace the
// constants below — app and report then share one model.

export const FEATURE_NAMES = [
  "amountLog", // ln(1 + amount)
  "amountRatio", // amount / cardholder's average spend
  "isNight", // 1 if transaction hour in 00:00–05:59
  "categoryRisk", // base risk weight of the merchant category (0..1)
  "velocity1h", // number of the cardholder's transactions in the prior hour
  "newCategory", // 1 if the cardholder has never used this category
] as const;

export type FeatureName = (typeof FEATURE_NAMES)[number];

// logit = INTERCEPT + Σ w_i * ((x_i - mean_i) / std_i);  p = sigmoid(logit)
export const INTERCEPT = -1.5;

export const WEIGHTS: Record<FeatureName, number> = {
  amountLog: 0.6,
  amountRatio: 1.2,
  isNight: 0.5,
  categoryRisk: 1.4,
  velocity1h: 1.0,
  newCategory: 0.7,
};

export const STANDARDIZATION: Record<FeatureName, { mean: number; std: number }> = {
  amountLog: { mean: 4.4, std: 1.2 },
  amountRatio: { mean: 1.0, std: 1.5 },
  isNight: { mean: 0.25, std: 0.43 },
  categoryRisk: { mean: 0.3, std: 0.25 },
  velocity1h: { mean: 0.5, std: 1.2 },
  newCategory: { mean: 0.3, std: 0.46 },
};

// Base fraud-risk weight per merchant category (also used as a feature).
export const CATEGORY_RISK: Record<string, number> = {
  groceries: 0.1,
  restaurants: 0.15,
  fuel: 0.2,
  electronics: 0.4,
  online_services: 0.4,
  travel: 0.45,
  jewellery: 0.6,
  money_transfer: 0.8,
  gambling: 0.85,
  cash_advance: 0.9,
};

export const DEFAULT_CATEGORY_RISK = 0.3;
