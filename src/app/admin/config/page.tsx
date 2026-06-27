import { getRiskConfig } from "@/lib/config";
import ConfigForm from "@/components/ConfigForm";

export default async function AdminConfigPage() {
  const config = await getRiskConfig();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Risk configuration</h1>
        <p className="mt-1 text-muted">
          Tune the multi-layer scoring engine. Changes apply to all subsequent transactions.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-surface p-6">
        <ConfigForm config={config} />
      </div>
    </div>
  );
}
