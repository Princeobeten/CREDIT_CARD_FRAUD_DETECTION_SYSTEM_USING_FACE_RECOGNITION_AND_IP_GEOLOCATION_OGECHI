import "server-only";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Transaction, type TransactionDoc } from "@/lib/models/Transaction";
import { FraudAlert } from "@/lib/models/FraudAlert";
import { Card } from "@/lib/models/Card";
import { getRiskConfig } from "@/lib/config";
import { extractFeatures } from "@/lib/ml/features";
import { scoreFeatures } from "@/lib/ml/scorer";
import { verifyFace } from "@/lib/face/verify";
import { geolocateIp } from "@/lib/geo/locate";
import { assessGeoRisk, type PriorLocation } from "@/lib/geo/risk";
import { combineRisk } from "@/lib/risk/engine";
import type { TransactionDecision } from "@/lib/types";

export interface AssessRequest {
  amount: number;
  merchantCategory: string;
  occurredAt?: Date;
  ip: string; // resolved by the route handler (real header IP or a simulated one)
  faceDescriptor?: number[]; // present on the follow-up call when a face check is required
}

export interface TransactionDTO {
  id: string;
  amount: number;
  merchantCategory: string;
  occurredAt: string;
  decision: TransactionDecision;
  compositeScore: number;
  mlScore: number;
  faceScore: number;
  geoScore: number;
  faceChecked: boolean;
  faceMatched: boolean | null;
  faceDistance: number | null;
  geoCountry: string | null;
  geoCity: string | null;
  reasons: string[];
}

export type AssessResult =
  | { status: "face_required"; mlScore: number; reasons: string[] }
  | { status: "completed"; transaction: TransactionDTO };

function toDTO(doc: TransactionDoc): TransactionDTO {
  return {
    id: doc._id.toString(),
    amount: doc.amount,
    merchantCategory: doc.merchantCategory,
    occurredAt: doc.occurredAt.toISOString(),
    decision: doc.decision as TransactionDecision,
    compositeScore: doc.compositeScore,
    mlScore: doc.mlScore,
    faceScore: doc.faceScore ?? 0,
    geoScore: doc.geoScore ?? 0,
    faceChecked: doc.faceChecked ?? false,
    faceMatched: doc.faceMatched ?? null,
    faceDistance: doc.faceDistance ?? null,
    geoCountry: doc.geoCountry ?? null,
    geoCity: doc.geoCity ?? null,
    reasons: doc.reasons ?? [],
  };
}

// The full multi-layer assessment pipeline (Figure 3.8):
// ML anomaly score -> (face check if escalated) -> geo check -> composite decision.
export async function assessTransaction(
  userId: string,
  req: AssessRequest,
): Promise<AssessResult> {
  await connectToDatabase();
  const occurredAt = req.occurredAt ?? new Date();
  const config = await getRiskConfig();
  const uid = new Types.ObjectId(userId);

  // 1) Machine-learning behavioural layer.
  const features = await extractFeatures(userId, {
    amount: req.amount,
    merchantCategory: req.merchantCategory,
    occurredAt,
  });
  const ml = scoreFeatures(features);
  const faceRequired = ml.probability >= config.mlEscalationThreshold;

  // 2) If the score escalates and we don't yet have a face capture, ask for one.
  if (faceRequired && (!req.faceDescriptor || req.faceDescriptor.length !== 128)) {
    return { status: "face_required", mlScore: ml.probability, reasons: ml.topReasons };
  }

  // 3) Biometric layer (only when escalated).
  let faceChecked = false;
  let faceMatched: boolean | null = null;
  let faceDistance: number | null = null;
  let faceScore = 0;
  const faceReasons: string[] = [];
  if (faceRequired && req.faceDescriptor) {
    faceChecked = true;
    const fv = await verifyFace(userId, req.faceDescriptor, config.faceMatchDistance);
    if (!fv.hasTemplate) {
      faceMatched = false;
      faceScore = 1;
      faceReasons.push("No enrolled facial biometric to verify against");
    } else {
      faceMatched = fv.matched;
      faceDistance = fv.distance;
      faceScore = fv.matched ? 0 : 1;
      faceReasons.push(
        fv.matched
          ? `Face verified (distance ${fv.distance?.toFixed(3)})`
          : `Face mismatch (distance ${fv.distance?.toFixed(3)})`,
      );
    }
  }

  // 4) Geospatial layer.
  const card = await Card.findOne({ userId: uid }).lean();
  const geo = await geolocateIp(req.ip);
  const priorDoc = await Transaction.findOne({ userId: uid, geoLat: { $ne: null } })
    .sort({ occurredAt: -1 })
    .lean();
  const prior: PriorLocation | null = priorDoc
    ? {
        country: priorDoc.geoCountry ?? null,
        lat: priorDoc.geoLat ?? null,
        lng: priorDoc.geoLng ?? null,
        occurredAt: priorDoc.occurredAt,
      }
    : null;
  const geoRisk = assessGeoRisk(geo, occurredAt, card?.homeCountry ?? null, prior, config);

  // 5) Composite aggregation + decision.
  const composite = combineRisk(
    { mlScore: ml.probability, faceScore, geoScore: geoRisk.geoScore },
    config,
  );

  const reasons = [...ml.topReasons, ...faceReasons, ...geoRisk.reasons];

  // 6) Persist the transaction with the full assessment.
  const doc = await Transaction.create({
    userId: uid,
    amount: req.amount,
    merchantCategory: req.merchantCategory,
    occurredAt,
    ip: geo.ip,
    geoCountry: geo.country,
    geoCity: geo.city,
    geoLat: geo.lat,
    geoLng: geo.lng,
    mlScore: ml.probability,
    faceChecked,
    faceMatched,
    faceDistance,
    faceScore,
    geoScore: geoRisk.geoScore,
    compositeScore: composite.compositeScore,
    decision: composite.decision,
    reasons,
  });

  // 7) Raise a fraud alert for anything not auto-approved (Module 6).
  if (composite.decision !== "approved") {
    await FraudAlert.create({
      transactionId: doc._id,
      userId: uid,
      reason: reasons[0] ?? "Elevated composite fraud risk",
      severity: composite.decision === "rejected" ? "high" : "medium",
      status: "open",
    });
  }

  return { status: "completed", transaction: toDTO(doc) };
}

export async function getUserTransactions(userId: string, limit = 25): Promise<TransactionDTO[]> {
  await connectToDatabase();
  const docs = await Transaction.find({ userId: new Types.ObjectId(userId) })
    .sort({ occurredAt: -1 })
    .limit(limit);
  return docs.map(toDTO);
}
