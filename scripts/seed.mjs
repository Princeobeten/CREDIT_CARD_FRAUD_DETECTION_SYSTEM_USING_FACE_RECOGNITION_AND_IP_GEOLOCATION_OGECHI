// Seed script: demo accounts, default risk config, and sample transactions/alerts.
// Run with:  npm run seed
// Uses the raw MongoDB driver via mongoose (no app imports — the app's modules are
// marked "server-only" and cannot be imported outside the Next.js runtime).
//
// WARNING: this RESETS the demo collections for a clean, repeatable demo.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");
const envText = fs.readFileSync(envPath, "utf8");
const uri = envText.match(/^MONGODB_URI="(.+)"$/m)?.[1];
if (!uri) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

const { Types } = mongoose;
const now = Date.now();
const daysAgo = (d) => new Date(now - d * 86_400_000);

async function main() {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  const db = mongoose.connection.db;
  console.log("Connected to", mongoose.connection.name);

  const C = {
    users: db.collection("users"),
    cards: db.collection("cards"),
    biometrics: db.collection("biometrictemplates"),
    transactions: db.collection("transactions"),
    alerts: db.collection("fraudalerts"),
    audit: db.collection("auditlogs"),
    config: db.collection("systemconfigs"),
  };

  // Reset for a clean, repeatable demo.
  for (const c of Object.values(C)) await c.deleteMany({});
  console.log("Cleared existing collections.");

  const passwordHash = await bcrypt.hash("password123", 10);
  const ts = (d) => ({ createdAt: daysAgo(d), updatedAt: daysAgo(d) });

  const adminId = new Types.ObjectId();
  const analystId = new Types.ObjectId();
  const cardholderId = new Types.ObjectId();

  await C.users.insertMany([
    { _id: adminId, email: "admin@demo.test", passwordHash, role: "admin", fullName: "System Administrator", ...ts(30) },
    { _id: analystId, email: "analyst@demo.test", passwordHash, role: "analyst", fullName: "Bank Fraud Analyst", ...ts(30) },
    { _id: cardholderId, email: "cardholder@demo.test", passwordHash, role: "cardholder", fullName: "Ada Cardholder", ...ts(30) },
  ]);
  console.log("Inserted 3 users.");

  await C.cards.insertOne({
    userId: cardholderId,
    last4: "4242",
    brand: "Visa",
    expiry: "08/27",
    homeCountry: "NG",
    homeCity: "Lagos",
    homeLat: 6.5244,
    homeLng: 3.3792,
    ...ts(30),
  });

  await C.config.insertOne({
    key: "global",
    weightMl: 0.5,
    weightFace: 0.3,
    weightGeo: 0.2,
    mlEscalationThreshold: 0.5,
    rejectThreshold: 0.7,
    reviewThreshold: 0.4,
    faceMatchDistance: 0.55,
    highRiskCountries: ["KP", "IR", "SY"],
    impossibleTravelKmh: 900,
    ...ts(30),
  });

  // Sample transactions spanning approved / review / rejected.
  const txTemplates = [
    { amount: 45, merchantCategory: "groceries", ml: 0.08, geo: 0, decision: "approved", country: "NG", reasons: [], faceChecked: false, faceMatched: null, composite: 0.06, d: 6 },
    { amount: 62, merchantCategory: "fuel", ml: 0.12, geo: 0, decision: "approved", country: "NG", reasons: [], faceChecked: false, faceMatched: null, composite: 0.09, d: 5 },
    { amount: 820, merchantCategory: "electronics", ml: 0.46, geo: 0, decision: "review", country: "NG", reasons: ["Amount far above the cardholder's typical spend"], faceChecked: false, faceMatched: null, composite: 0.41, d: 4 },
    { amount: 1500, merchantCategory: "money_transfer", ml: 0.58, geo: 0.9, decision: "rejected", country: "RU", reasons: ["High-risk merchant category", "Country (RU) differs from home country (NG)", "Impossible travel: 6300 km from the previous transaction in 35 min"], faceChecked: true, faceMatched: true, faceDistance: 0.42, composite: 0.74, d: 3 },
    { amount: 1200, merchantCategory: "gambling", ml: 0.71, geo: 0.3, decision: "rejected", country: "NG", reasons: ["High-risk merchant category", "Transaction occurred during late-night hours"], faceChecked: true, faceMatched: false, faceDistance: 0.78, composite: 0.81, d: 2 },
    { amount: 2000, merchantCategory: "cash_advance", ml: 0.66, geo: 0, decision: "review", country: "NG", reasons: ["High-risk merchant category", "Rapid succession of recent transactions"], faceChecked: true, faceMatched: true, faceDistance: 0.39, composite: 0.49, d: 1 },
  ];

  const alertDocs = [];
  for (const t of txTemplates) {
    const txId = new Types.ObjectId();
    const faceScore = t.faceChecked ? (t.faceMatched ? 0 : 1) : 0;
    await C.transactions.insertOne({
      _id: txId,
      userId: cardholderId,
      amount: t.amount,
      merchantCategory: t.merchantCategory,
      occurredAt: daysAgo(t.d),
      ip: "203.0.113.10",
      geoCountry: t.country,
      geoCity: null,
      geoLat: null,
      geoLng: null,
      mlScore: t.ml,
      faceChecked: t.faceChecked,
      faceMatched: t.faceMatched,
      faceDistance: t.faceDistance ?? null,
      faceScore,
      geoScore: t.geo,
      compositeScore: t.composite,
      decision: t.decision,
      reasons: t.reasons,
      ...ts(t.d),
    });
    if (t.decision !== "approved") {
      alertDocs.push({
        transactionId: txId,
        userId: cardholderId,
        reason: t.reasons[0] ?? "Elevated composite fraud risk",
        severity: t.decision === "rejected" ? "high" : "medium",
        status: "open",
        reviewedBy: null,
        reviewNote: null,
        resolvedAt: null,
        ...ts(t.d),
      });
    }
  }
  await C.transactions.countDocuments();
  if (alertDocs.length) await C.alerts.insertMany(alertDocs);
  console.log(`Inserted ${txTemplates.length} transactions and ${alertDocs.length} alerts.`);

  await mongoose.disconnect();
  console.log("\n✓ Seed complete. Demo logins (password: password123):");
  console.log("   admin@demo.test       (System Administrator)");
  console.log("   analyst@demo.test     (Bank Fraud Analyst)");
  console.log("   cardholder@demo.test  (Cardholder — enroll a face via the UI to test verification)");
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
