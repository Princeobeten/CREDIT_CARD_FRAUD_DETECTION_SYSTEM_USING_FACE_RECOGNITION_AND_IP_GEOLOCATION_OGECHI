import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getUserTransactions } from "@/lib/transactions";
import { DecisionBadge, prettyCategory } from "@/components/risk";

export default async function TransactionsPage() {
  const session = await requireRole("cardholder");
  const transactions = await getUserTransactions(session.userId, 50);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Transaction history</h1>
      <p className="mt-1 text-muted">Your recent transactions and their fraud assessments.</p>

      {transactions.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-muted">No transactions yet.</p>
          <Link
            href="/cardholder/pay"
            className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90"
          >
            Make your first transaction
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-background text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">Decision</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-muted">
                    {new Date(tx.occurredAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">{prettyCategory(tx.merchantCategory)}</td>
                  <td className="px-4 py-3 text-muted">{tx.geoCountry ?? "—"}</td>
                  <td className="px-4 py-3">{(tx.compositeScore * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3">
                    <DecisionBadge decision={tx.decision} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
