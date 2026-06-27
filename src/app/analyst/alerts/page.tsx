import Link from "next/link";
import { listAlerts } from "@/lib/alerts";
import AlertList from "@/components/AlertList";
import { ALERT_STATUSES } from "@/lib/constants";
import type { AlertStatus } from "@/lib/types";

const FILTERS: { value: AlertStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  ...ALERT_STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })),
];

export default async function AlertsPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await props.searchParams;
  const active = (FILTERS.find((f) => f.value === status)?.value ?? "all") as AlertStatus | "all";
  const alerts = await listAlerts(active === "all" ? undefined : active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fraud alerts</h1>
        <p className="mt-1 text-muted">Review flagged transactions and record a determination.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const isActive = f.value === active;
          const href = f.value === "all" ? "/analyst/alerts" : `/analyst/alerts?status=${f.value}`;
          return (
            <Link
              key={f.value}
              href={href}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                isActive ? "bg-brand text-brand-fg" : "border border-border bg-surface hover:bg-background"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <AlertList alerts={alerts} />
    </div>
  );
}
