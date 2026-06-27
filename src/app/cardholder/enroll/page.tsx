import { requireRole } from "@/lib/dal";
import { getEnrollment } from "@/lib/enrollment";
import EnrollForm from "./EnrollForm";

export default async function EnrollPage() {
  const session = await requireRole("cardholder");
  const enrollment = await getEnrollment(session.userId);

  return (
    <div>
      <h1 className="text-2xl font-semibold">Enrollment</h1>
      <p className="mt-1 max-w-2xl text-muted">
        Register your card and capture your facial biometric. The face descriptor is stored as a
        128-dimension vector and used to verify your identity during high-risk transactions.
      </p>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <EnrollForm initial={enrollment} />
      </div>
    </div>
  );
}
