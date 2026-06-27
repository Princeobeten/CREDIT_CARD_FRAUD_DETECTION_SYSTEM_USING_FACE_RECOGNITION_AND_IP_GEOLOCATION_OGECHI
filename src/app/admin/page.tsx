import Link from "next/link";
import { getAdminStats } from "@/lib/admin";
import { getRiskConfig } from "@/lib/config";
import StatCard from "@/components/StatCard";

export default async function AdminOverview() {
  const [stats, config] = await Promise.all([getAdminStats(), getRiskConfig()]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">System administration</h1>
        <p className="mt-1 text-muted">Users, risk configuration, and audit overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={stats.totalUsers} />
        <StatCard label="Cardholders" value={stats.byRole.cardholder} />
        <StatCard label="Transactions" value={stats.totalTransactions} />
        <StatCard label="Fraud alerts" value={stats.totalAlerts} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Current risk configuration</h2>
            <Link href="/admin/config" className="text-sm font-medium text-brand hover:underline">
              Edit →
            </Link>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Weights (ML / Face / Geo)</dt>
              <dd className="font-medium">
                {config.weights.ml.toFixed(2)} / {config.weights.face.toFixed(2)} /{" "}
                {config.weights.geo.toFixed(2)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Face escalation threshold</dt>
              <dd className="font-medium">{config.mlEscalationThreshold}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Review / Reject thresholds</dt>
              <dd className="font-medium">
                {config.reviewThreshold} / {config.rejectThreshold}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Face match distance</dt>
              <dd className="font-medium">{config.faceMatchDistance}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">High-risk countries</dt>
              <dd className="font-medium">{config.highRiskCountries.join(", ") || "none"}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-semibold">Manage</h2>
          <div className="mt-4 space-y-2">
            <Link
              href="/admin/users"
              className="block rounded-lg border border-border p-3 text-sm font-medium hover:bg-background"
            >
              Manage users & roles →
            </Link>
            <Link
              href="/admin/config"
              className="block rounded-lg border border-border p-3 text-sm font-medium hover:bg-background"
            >
              Configure risk thresholds →
            </Link>
            <Link
              href="/admin/audit"
              className="block rounded-lg border border-border p-3 text-sm font-medium hover:bg-background"
            >
              View audit log →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
