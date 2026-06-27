import "server-only";
import { connectToDatabase } from "@/lib/db";
import { SystemConfig } from "@/lib/models/SystemConfig";
import { DEFAULT_CONFIG, type RiskConfig } from "@/lib/constants";

// Loads the admin-tunable risk configuration, falling back to DEFAULT_CONFIG when
// no override document exists. Used by the ML escalation gate, the geo risk
// analyzer, the face match threshold, and the composite scoring engine.
export async function getRiskConfig(): Promise<RiskConfig> {
  await connectToDatabase();
  const doc = await SystemConfig.findOne({ key: "global" }).lean();
  if (!doc) {
    return {
      weights: { ...DEFAULT_CONFIG.weights },
      mlEscalationThreshold: DEFAULT_CONFIG.mlEscalationThreshold,
      rejectThreshold: DEFAULT_CONFIG.rejectThreshold,
      reviewThreshold: DEFAULT_CONFIG.reviewThreshold,
      faceMatchDistance: DEFAULT_CONFIG.faceMatchDistance,
      highRiskCountries: [...DEFAULT_CONFIG.highRiskCountries],
      impossibleTravelKmh: DEFAULT_CONFIG.impossibleTravelKmh,
    };
  }
  return {
    weights: { ml: doc.weightMl, face: doc.weightFace, geo: doc.weightGeo },
    mlEscalationThreshold: doc.mlEscalationThreshold,
    rejectThreshold: doc.rejectThreshold,
    reviewThreshold: doc.reviewThreshold,
    faceMatchDistance: doc.faceMatchDistance,
    highRiskCountries: doc.highRiskCountries ?? [],
    impossibleTravelKmh: doc.impossibleTravelKmh,
  };
}

// Persists a config override (admin). Returns the resulting RiskConfig.
export async function saveRiskConfig(next: RiskConfig): Promise<void> {
  await connectToDatabase();
  await SystemConfig.findOneAndUpdate(
    { key: "global" },
    {
      key: "global",
      weightMl: next.weights.ml,
      weightFace: next.weights.face,
      weightGeo: next.weights.geo,
      mlEscalationThreshold: next.mlEscalationThreshold,
      rejectThreshold: next.rejectThreshold,
      reviewThreshold: next.reviewThreshold,
      faceMatchDistance: next.faceMatchDistance,
      highRiskCountries: next.highRiskCountries,
      impossibleTravelKmh: next.impossibleTravelKmh,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}
