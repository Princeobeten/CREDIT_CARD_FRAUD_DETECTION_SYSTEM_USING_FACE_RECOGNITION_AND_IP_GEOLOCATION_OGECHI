"use client";

import { useState } from "react";
import FaceCapture, { type CapturePayload } from "@/components/FaceCapture";
import { DecisionBadge, ScoreBar, prettyCategory } from "@/components/risk";
import { MERCHANT_CATEGORIES } from "@/lib/constants";
import type { TransactionDTO } from "@/lib/transactions";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

interface SubmitPayload {
  amount: number;
  merchantCategory: string;
  testIp?: string;
}

type AssessResponse =
  | { status: "face_required"; mlScore: number; reasons: string[] }
  | { status: "completed"; transaction: TransactionDTO };

async function postTransaction(
  payload: SubmitPayload & { faceDescriptor?: number[] },
): Promise<AssessResponse> {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Transaction failed");
  return data as AssessResponse;
}

export default function PayForm() {
  const [stage, setStage] = useState<"form" | "face" | "result">("form");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<SubmitPayload | null>(null);
  const [mlScore, setMlScore] = useState<number | null>(null);
  const [result, setResult] = useState<TransactionDTO | null>(null);

  async function handleInitialSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const amount = Number(fd.get("amount"));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    const next: SubmitPayload = {
      amount,
      merchantCategory: String(fd.get("merchantCategory")),
      testIp: String(fd.get("testIp") ?? "").trim() || undefined,
    };
    setPayload(next);
    setPending(true);
    try {
      const res = await postTransaction(next);
      if (res.status === "face_required") {
        setMlScore(res.mlScore);
        setStage("face");
      } else {
        setResult(res.transaction);
        setStage("result");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setPending(false);
    }
  }

  async function handleFace(capture: CapturePayload) {
    if (!payload) return;
    setError(null);
    setPending(true);
    try {
      const res = await postTransaction({ ...payload, faceDescriptor: capture.descriptor });
      if (res.status === "completed") {
        setResult(res.transaction);
        setStage("result");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setPending(false);
    }
  }

  function reset() {
    setStage("form");
    setPayload(null);
    setMlScore(null);
    setResult(null);
    setError(null);
  }

  if (stage === "result" && result) {
    return <ResultCard tx={result} onReset={reset} />;
  }

  if (stage === "face") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This transaction scored as high-risk
          {mlScore != null && ` (ML score ${(mlScore * 100).toFixed(0)}%)`}. Please verify your
          identity with a live face check to continue.
        </div>
        <FaceCapture onCapture={handleFace} disabled={pending} captureLabel="Verify face" />
        {pending && <p className="text-sm text-muted">Assessing transaction…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={reset}
          className="text-sm font-medium text-muted hover:underline"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleInitialSubmit} className="space-y-4">
      <div>
        <label htmlFor="amount" className="mb-1 block text-sm font-medium">
          Amount
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="120.00"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="merchantCategory" className="mb-1 block text-sm font-medium">
          Merchant category
        </label>
        <select id="merchantCategory" name="merchantCategory" className={inputCls}>
          {MERCHANT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {prettyCategory(c)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="testIp" className="mb-1 block text-sm font-medium">
          Simulated IP <span className="font-normal text-muted">(optional, for demo)</span>
        </label>
        <input id="testIp" name="testIp" placeholder="e.g. 8.8.8.8" className={inputCls} />
        <p className="mt-1 text-xs text-muted">
          Leave blank to use your real IP. Enter a foreign IP to demonstrate geolocation risk.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-fg hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Assessing…" : "Submit transaction"}
      </button>
    </form>
  );
}

function ResultCard({ tx, onReset }: { tx: TransactionDTO; onReset: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">Decision</p>
          <div className="mt-1 flex items-center gap-3">
            <DecisionBadge decision={tx.decision} />
            <span className="text-sm text-muted">
              composite risk {(tx.compositeScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-background"
        >
          New transaction
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ScoreBar label="ML anomaly" value={tx.mlScore} />
        <ScoreBar label="Face risk" value={tx.faceScore} />
        <ScoreBar label="Geolocation" value={tx.geoScore} />
      </div>

      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="text-muted">Amount</p>
          <p className="font-medium">
            {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ·{" "}
            {prettyCategory(tx.merchantCategory)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-3">
          <p className="text-muted">Location</p>
          <p className="font-medium">
            {tx.geoCountry ? `${tx.geoCity ? tx.geoCity + ", " : ""}${tx.geoCountry}` : "Unknown"}
          </p>
        </div>
        {tx.faceChecked && (
          <div className="rounded-lg border border-border bg-background p-3 sm:col-span-2">
            <p className="text-muted">Biometric check</p>
            <p className="font-medium">
              {tx.faceMatched ? "Face matched" : "Face did not match"}
              {tx.faceDistance != null && ` (distance ${tx.faceDistance.toFixed(3)})`}
            </p>
          </div>
        )}
      </div>

      {tx.reasons.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium">Contributing factors</p>
          <ul className="space-y-1 text-sm text-muted">
            {tx.reasons.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-brand">•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
