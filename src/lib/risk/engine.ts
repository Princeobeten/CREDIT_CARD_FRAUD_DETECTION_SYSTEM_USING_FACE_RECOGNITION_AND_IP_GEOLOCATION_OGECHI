// Composite fraud scoring engine (Module 5). Pure maths — no DB, no secrets.
// Aggregates the three independent detection layers into one weighted score and
// maps it to a decision, exactly as in Figure 3.10 (central Risk Scoring Engine).

import type { TransactionDecision } from "@/lib/types";
import type { RiskConfig } from "@/lib/constants";

export interface CompositeInput {
  mlScore: number; // 0..1 behavioural anomaly probability
  faceScore: number; // 0..1 (0 = matched/not-required, 1 = mismatch/failed)
  geoScore: number; // 0..1 geospatial risk
}

export interface CompositeResult {
  compositeScore: number; // 0..1
  decision: TransactionDecision;
}

export function combineRisk(input: CompositeInput, config: RiskConfig): CompositeResult {
  const { ml, face, geo } = config.weights;
  const total = ml + face + geo || 1;
  const composite =
    (ml * input.mlScore + face * input.faceScore + geo * input.geoScore) / total;

  let decision: TransactionDecision;
  if (composite >= config.rejectThreshold) decision = "rejected";
  else if (composite >= config.reviewThreshold) decision = "review";
  else decision = "approved";

  return { compositeScore: composite, decision };
}
