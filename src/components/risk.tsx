import type { TransactionDecision } from "@/lib/types";

const DECISION_STYLE: Record<TransactionDecision, string> = {
  approved: "bg-green-100 text-green-700",
  review: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};

const DECISION_LABEL: Record<TransactionDecision, string> = {
  approved: "Approved",
  review: "Flagged for review",
  rejected: "Rejected",
};

export function DecisionBadge({ decision }: { decision: TransactionDecision }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${DECISION_STYLE[decision]}`}>
      {DECISION_LABEL[decision]}
    </span>
  );
}

function barColor(value: number): string {
  if (value >= 0.7) return "bg-red-500";
  if (value >= 0.4) return "bg-amber-500";
  return "bg-green-500";
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-background">
        <div className={`h-2 rounded-full ${barColor(value)}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function prettyCategory(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
