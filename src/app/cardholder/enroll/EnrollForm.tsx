"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import FaceCapture, { type CapturePayload } from "@/components/FaceCapture";
import { enrollCardholder, type EnrollInput } from "@/lib/actions/enroll";
import type { EnrollmentStatus } from "@/lib/enrollment";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

const BRANDS = ["Visa", "Mastercard", "Verve", "American Express"];

export default function EnrollForm({ initial }: { initial: EnrollmentStatus }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [descriptor, setDescriptor] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!descriptor) {
      setError("Please capture your face before saving.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const input: EnrollInput = {
      last4: String(fd.get("last4") ?? ""),
      brand: String(fd.get("brand") ?? ""),
      expiry: String(fd.get("expiry") ?? ""),
      homeCountry: String(fd.get("homeCountry") ?? ""),
      homeCity: String(fd.get("homeCity") ?? ""),
    };

    startTransition(async () => {
      const res = await enrollCardholder(input, descriptor);
      if (res.ok) {
        setDone(true);
      } else {
        setError(res.error ?? "Enrollment failed. Please try again.");
      }
    });
  }

  if (done) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <h3 className="font-semibold text-green-800">Enrollment complete</h3>
        <p className="mt-1 text-sm text-green-700">
          Your card and facial biometric template are saved. High-risk transactions will now
          require a live face check.
        </p>
        <Link
          href="/cardholder"
          className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-fg hover:opacity-90"
        >
          Go to overview
        </Link>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-2">
      {/* Card details */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Card details</h2>

        <div>
          <label htmlFor="last4" className="mb-1 block text-sm font-medium">
            Card number (last 4 digits)
          </label>
          <input
            id="last4"
            name="last4"
            inputMode="numeric"
            maxLength={4}
            placeholder="4242"
            defaultValue={initial.card?.last4 ?? ""}
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="brand" className="mb-1 block text-sm font-medium">
              Brand
            </label>
            <select
              id="brand"
              name="brand"
              defaultValue={initial.card?.brand ?? BRANDS[0]}
              className={inputCls}
            >
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="expiry" className="mb-1 block text-sm font-medium">
              Expiry (MM/YY)
            </label>
            <input
              id="expiry"
              name="expiry"
              placeholder="08/27"
              maxLength={5}
              defaultValue={initial.card?.expiry ?? ""}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="homeCountry" className="mb-1 block text-sm font-medium">
              Home country
            </label>
            <input
              id="homeCountry"
              name="homeCountry"
              maxLength={2}
              placeholder="NG"
              defaultValue={initial.card?.homeCountry ?? "NG"}
              className={`${inputCls} uppercase`}
            />
          </div>
          <div>
            <label htmlFor="homeCity" className="mb-1 block text-sm font-medium">
              Home city (optional)
            </label>
            <input
              id="homeCity"
              name="homeCity"
              placeholder="Lagos"
              defaultValue={initial.card?.homeCity ?? ""}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      {/* Biometric capture */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Facial biometric {initial.hasFace && "(re-enroll)"}
        </h2>
        <FaceCapture
          onCapture={(p: CapturePayload) => {
            setDescriptor(p.descriptor);
            setError(null);
          }}
          onReset={() => setDescriptor(null)}
          disabled={pending}
        />
      </div>

      {/* Submit */}
      <div className="md:col-span-2">
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-fg hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save enrollment"}
        </button>
      </div>
    </form>
  );
}
