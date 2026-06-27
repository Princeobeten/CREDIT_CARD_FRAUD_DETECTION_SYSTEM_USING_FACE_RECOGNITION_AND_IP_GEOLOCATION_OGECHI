import Link from "next/link";
import { getAlertStats, listAlerts } from "@/lib/alerts";
import StatCard from "@/components/StatCard";
import AlertList from "@/components/AlertList";

export default async function AnalystOverview() {
  const [stats, openAlerts] = await Promise.all([getAlertStats(), listAlerts("open")]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Fraud monitoring</h1>
        <p className="mt-1 text-muted">Overview of fraud alerts and transaction risk.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open alerts" value={stats.openCount} accent={stats.openCount > 0 ? "warning" : "default"} />
        <StatCard
          label="High severity"
          value={stats.highSeverityCount}
          accent={stats.highSeverityCount > 0 ? "danger" : "default"}
        />
        <StatCard
          label="Flagged transactions"
          value={stats.flaggedTransactions}
          hint={`${stats.rejectedTransactions} rejected`}
        />
        <StatCard
          label="Fraud rate"
          value={`${stats.fraudRatePct.toFixed(1)}%`}
          hint={`of ${stats.totalTransactions} transactions`}
        />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Open alerts</h2>
          <Link href="/analyst/alerts" className="text-sm font-medium text-brand hover:underline">
            View all alerts →
          </Link>
        </div>
        <AlertList alerts={openAlerts.slice(0, 5)} />
      </div>
    </div>
  );
}
