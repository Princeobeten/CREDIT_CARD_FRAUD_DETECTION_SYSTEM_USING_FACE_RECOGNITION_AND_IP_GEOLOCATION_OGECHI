"use client";

import { useState, useTransition } from "react";
import { updateRiskConfigAction } from "@/lib/actions/admin";
import type { RiskConfig } from "@/lib/constants";

const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

function Field({
  label,
  name,
  defaultValue,
  step = "0.01",
  hint,
}: {
  label: string;
  name: string;
  defaultValue: number | string;
  step?: string;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input id={name} name={name} type="number" step={step} defaultValue={defaultValue} className={inputCls} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default function ConfigForm({ config }: { config: RiskConfig }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    const num = (k: string) => Number(fd.get(k));
    startTransition(async () => {
      const res = await updateRiskConfigAction({
        weightMl: num("weightMl"),
        weightFace: num("weightFace"),
        weightGeo: num("weightGeo"),
        mlEscalationThreshold: num("mlEscalationThreshold"),
        reviewThreshold: num("reviewThreshold"),
        rejectThreshold: num("rejectThreshold"),
        faceMatchDistance: num("faceMatchDistance"),
        impossibleTravelKmh: num("impossibleTravelKmh"),
        highRiskCountries: String(fd.get("highRiskCountries") ?? ""),
      });
      setMessage(
        res.ok
          ? { ok: true, text: "Configuration saved. Weights normalised to sum to 1." }
          : { ok: false, text: res.error ?? "Save failed" },
      );
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Layer weights</h2>
        <p className="text-xs text-muted">Relative influence of each layer; normalised to sum to 1 on save.</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Field label="ML" name="weightMl" defaultValue={config.weights.ml} />
          <Field label="Face" name="weightFace" defaultValue={config.weights.face} />
          <Field label="Geo" name="weightGeo" defaultValue={config.weights.geo} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Thresholds</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field
            label="Face escalation (ML ≥)"
            name="mlEscalationThreshold"
            defaultValue={config.mlEscalationThreshold}
            hint="ML score that triggers a face + geo check"
          />
          <Field
            label="Face match distance (≤)"
            name="faceMatchDistance"
            defaultValue={config.faceMatchDistance}
            hint="Lower = stricter biometric match"
          />
          <Field
            label="Review threshold (composite ≥)"
            name="reviewThreshold"
            defaultValue={config.reviewThreshold}
          />
          <Field
            label="Reject threshold (composite ≥)"
            name="rejectThreshold"
            defaultValue={config.rejectThreshold}
          />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Geolocation</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field
            label="Impossible travel (km/h >)"
            name="impossibleTravelKmh"
            defaultValue={config.impossibleTravelKmh}
            step="1"
          />
          <div>
            <label htmlFor="highRiskCountries" className="mb-1 block text-sm font-medium">
              High-risk countries
            </label>
            <input
              id="highRiskCountries"
              name="highRiskCountries"
              defaultValue={config.highRiskCountries.join(", ")}
              placeholder="KP, IR, SY"
              className={inputCls}
            />
            <p className="mt-1 text-xs text-muted">Comma-separated 2-letter codes</p>
          </div>
        </div>
      </div>

      {message && (
        <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-fg hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save configuration"}
      </button>
    </form>
  );
}
