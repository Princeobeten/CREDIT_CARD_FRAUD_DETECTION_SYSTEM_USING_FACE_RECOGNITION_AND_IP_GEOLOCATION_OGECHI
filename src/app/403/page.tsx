import Link from "next/link";

export default function Forbidden() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="text-5xl font-bold text-brand">403</p>
      <h1 className="mt-4 text-2xl font-semibold">Access denied</h1>
      <p className="mt-2 max-w-md text-muted">
        Your account role does not have permission to view this page.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-brand px-4 py-2 font-medium text-brand-fg hover:opacity-90"
      >
        Back to home
      </Link>
    </main>
  );
}
