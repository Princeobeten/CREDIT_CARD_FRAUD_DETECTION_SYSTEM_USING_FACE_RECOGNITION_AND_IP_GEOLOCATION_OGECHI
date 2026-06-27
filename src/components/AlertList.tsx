"use client";

import { useState, useTransition } from "react";
import { DecisionBadge, prettyCategory } from "@/components/risk";
import { reviewAlertAction } from "@/lib/actions/alerts";
import type { AlertDTO } from "@/lib/alerts";
import type { AlertSeverity, AlertStatus } from "@/lib/types";

const SEVERITY_STYLE: Record<AlertSeverity, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

const STATUS_STYLE: Record<AlertStatus, string> = {
  open: "bg-blue-100 text-blue-700",
  reviewing: "bg-purple-100 text-purple-700",
  resolved: "bg-green-100 text-green-700",
  dismissed: "bg-slate-100 text-slate-600",
};

function AlertCard({ alert }: { alert: AlertDTO }) {
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const closed = alert.status === "resolved" || alert.status === "dismissed";

  function act(action: "reviewing" | "resolved" | "dismissed") {
    setError(null);
    startTransition(async () => {
      const res = await reviewAlertAction({ alertId: alert.id, action, note: note || undefined });
      if (!res.ok) setError(res.error ?? "Action failed");
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SEVERITY_STYLE[alert.severity]}`}
            >
              {alert.severity.toUpperCase()}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[alert.status]}`}
            >
              {alert.status}
            </span>
            <DecisionBadge decision={alert.decision} />
          </div>
          <p className="mt-2 font-medium">{alert.reason}</p>
          <p className="text-sm text-muted">
            {alert.userName} ({alert.userEmail}) ·{" "}
            {alert.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ·{" "}
            {prettyCategory(alert.merchantCategory)} · {alert.geoCountry ?? "unknown location"}
          </p>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold">{(alert.compositeScore * 100).toFixed(0)}%</p>
          <p className="text-xs text-muted">{new Date(alert.occurredAt).toLocaleString()}</p>
        </div>
      </div>

      {alert.reasons.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {alert.reasons.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-brand">•</span>
              {r}
            </li>
          ))}
        </ul>
      )}

      {alert.faceMatched === false && (
        <p className="mt-2 text-sm font-medium text-red-600">⚠ Facial biometric did not match.</p>
      )}

      {alert.reviewNote && (
        <p className="mt-2 rounded-lg bg-background p-2 text-sm text-muted">
          Note: {alert.reviewNote}
        </p>
      )}

      {!closed && (
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a review note (optional)"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <div className="flex flex-wrap gap-2">
            {alert.status === "open" && (
              <button
                type="button"
                onClick={() => act("reviewing")}
                disabled={pending}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-background disabled:opacity-60"
              >
                Mark reviewing
              </button>
            )}
            <button
              type="button"
              onClick={() => act("resolved")}
              disabled={pending}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
            >
              Confirm fraud (resolve)
            </button>
            <button
              type="button"
              onClick={() => act("dismissed")}
              disabled={pending}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-background disabled:opacity-60"
            >
              Dismiss (false positive)
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default function AlertList({ alerts }: { alerts: AlertDTO[] }) {
  if (alerts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted">
        No alerts to show.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {alerts.map((a) => (
        <AlertCard key={a.id} alert={a} />
      ))}
    </div>
  );
}
