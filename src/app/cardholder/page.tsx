import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getEnrollment } from "@/lib/enrollment";

function StatusRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <span className="text-sm">{label}</span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
          ok ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
        }`}
      >
        {ok ? "Complete" : "Pending"}
      </span>
    </div>
  );
}

export default async function CardholderOverview() {
  const session = await requireRole("cardholder");
  const enrollment = await getEnrollment(session.userId);
  const fullyEnrolled = enrollment.hasCard && enrollment.hasFace;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="mt-1 text-muted">Your account and fraud-protection status.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-semibold">Enrollment status</h2>
          <div className="mt-3">
            <StatusRow label="Card registered" ok={enrollment.hasCard} />
            <StatusRow label="Facial biometric captured" ok={enrollment.hasFace} />
          </div>
          {!fullyEnrolled && (
            <Link
              href="/cardholder/enroll"
              className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90"
            >
              Complete enrollment
            </Link>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-semibold">How protection works</h2>
          <ol className="mt-3 space-y-2 text-sm text-muted">
            <li>1. Each transaction is scored by a machine-learning anomaly model.</li>
            <li>2. High-risk transactions trigger a live facial verification.</li>
            <li>3. Your originating IP is geolocated to flag impossible travel.</li>
            <li>4. A composite risk score decides approve, review, or reject.</li>
          </ol>
        </section>
      </div>

      {fullyEnrolled && (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-semibold">You&apos;re protected</h2>
          <p className="mt-1 text-sm text-muted">
            Card ending {enrollment.card?.last4} · {enrollment.card?.brand} · home{" "}
            {enrollment.card?.homeCountry}. Transaction simulation is coming in the next step.
          </p>
        </div>
      )}
    </div>
  );
}
