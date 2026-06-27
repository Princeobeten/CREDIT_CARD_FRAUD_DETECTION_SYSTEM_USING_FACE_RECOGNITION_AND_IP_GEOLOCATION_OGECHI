import Link from "next/link";
import { requireRole } from "@/lib/dal";
import { getEnrollment } from "@/lib/enrollment";
import PayForm from "./PayForm";

export default async function PayPage() {
  const session = await requireRole("cardholder");
  const enrollment = await getEnrollment(session.userId);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold">New transaction</h1>
      <p className="mt-1 text-muted">
        Submit a transaction to run it through the multi-layer fraud assessment.
      </p>

      {!enrollment.hasFace && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You haven&apos;t enrolled a facial biometric yet. High-risk transactions will fail the
          face check.{" "}
          <Link href="/cardholder/enroll" className="font-medium underline">
            Complete enrollment
          </Link>
          .
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <PayForm />
      </div>
    </div>
  );
}
