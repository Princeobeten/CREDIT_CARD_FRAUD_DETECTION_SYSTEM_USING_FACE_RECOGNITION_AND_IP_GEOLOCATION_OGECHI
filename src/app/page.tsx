import Link from "next/link";

const LAYERS = [
  {
    title: "Machine Learning",
    body: "A logistic-regression model scores each transaction's behavioural anomaly probability.",
  },
  {
    title: "Face Recognition",
    body: "High-risk transactions trigger a live facial check against the cardholder's enrolled biometric template.",
  },
  {
    title: "IP Geolocation",
    body: "The originating IP is geolocated to detect new regions, high-risk countries, and impossible-travel patterns.",
  },
];

const MODULES = [
  "User Enrollment",
  "Transaction Monitoring",
  "Face Recognition",
  "IP Geolocation",
  "Risk Scoring Engine",
  "Fraud Alert & Reporting",
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">
            Fraud<span className="text-brand">Guard</span>
          </span>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/login" className="rounded-md px-3 py-2 font-medium hover:bg-background">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-brand px-3 py-2 font-medium text-brand-fg hover:opacity-90"
            >
              Create account
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <p className="mb-3 text-sm font-medium text-brand">Multi-layer fraud detection</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Credit card fraud detection using face recognition and IP geolocation
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">
          A unified decision engine that combines machine-learning anomaly detection, real-time
          biometric verification, and geospatial risk analysis into a single composite fraud risk
          score.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/register"
            className="rounded-md bg-brand px-5 py-3 font-medium text-brand-fg hover:opacity-90"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-border bg-surface px-5 py-3 font-medium hover:bg-background"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Detection layers */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {LAYERS.map((l) => (
            <div key={l.title} className="rounded-xl border border-border bg-surface p-6">
              <h3 className="font-semibold">{l.title}</h3>
              <p className="mt-2 text-sm text-muted">{l.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <h2 className="text-sm font-medium text-muted">Six integrated modules</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {MODULES.map((m) => (
            <span
              key={m}
              className="rounded-full border border-border bg-surface px-3 py-1 text-sm"
            >
              {m}
            </span>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-border bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-6 text-sm text-muted">
          Final-year project prototype · FraudGuard
        </div>
      </footer>
    </main>
  );
}
