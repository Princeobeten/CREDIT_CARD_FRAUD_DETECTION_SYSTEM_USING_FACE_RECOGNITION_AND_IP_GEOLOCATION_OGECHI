// Logistic-regression parameters for the transaction anomaly model.
//
// The live app scores INTERPRETABLE features it can compute at inference time
// (a deployable model can't reproduce the Kaggle dataset's anonymized V1..V28).
// The intercept, weights, and standardization below are the values trained and
// exported by docs/ml_notebook/fraud_model_training.ipynb, so the running app and
// the report metrics use one and the same logistic-regression model.

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
// Trained by docs/ml_notebook/fraud_model_training.ipynb (Part 2) and pasted here,
// so the running app and the report metrics use the identical logistic-regression model.
export const INTERCEPT = -5.454237;

export const WEIGHTS: Record<FeatureName, number> = {
  amountLog: 1.276633,
  amountRatio: 1.715773,
  isNight: 0.562247,
  categoryRisk: 2.708956,
  velocity1h: 1.230556,
  newCategory: 0.579506,
};

export const STANDARDIZATION: Record<FeatureName, { mean: number; std: number }> = {
  amountLog: { mean: 4.093055, std: 1.077357 },
  amountRatio: { mean: 1.029831, std: 0.731043 },
  isNight: { mean: 0.140500, std: 0.347505 },
  categoryRisk: { mean: 0.278882, std: 0.180683 },
  velocity1h: { mean: 0.388250, std: 0.714101 },
  newCategory: { mean: 0.223179, std: 0.416377 },
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
