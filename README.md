# FraudGuard — Credit Card Fraud Detection Prototype

A multi-layer credit card fraud detection system that combines **machine-learning anomaly
detection**, **face-recognition authentication**, and **IP-geolocation risk analysis** into a
single composite fraud risk score. Built for the final-year project described in
`../docs/Chapter 3 ...pdf`.

Stack: **Next.js 16** (App Router, TypeScript) · **MongoDB Atlas** (Mongoose) ·
**face-api.js** (`@vladmandic/face-api`) · **ipapi.co** · custom JWT auth (jose) · Tailwind v4.

> ⚠️ Built on Next.js 16, which has breaking changes vs older versions. See
> [`NEXTJS16_NOTES.md`](./NEXTJS16_NOTES.md) before modifying Next.js-specific code.

---

## The six modules → where they live

| Module (Chapter 3) | Implementation |
|---|---|
| 1. User Enrollment | `src/app/cardholder/enroll` + `src/components/FaceCapture.tsx` → `src/lib/actions/enroll.ts` |
| 2. Transaction Monitoring (ML) | `src/lib/ml/` (features, logistic-regression scorer, coefficients) |
| 3. Face Recognition | `src/lib/face/` (browser capture, server-side descriptor matching) |
| 4. IP Geolocation | `src/lib/geo/` (lookup + impossible-travel) |
| 5. Risk Scoring Engine | `src/lib/risk/engine.ts` + orchestrator `src/lib/transactions.ts` |
| 6. Fraud Alert & Reporting | `src/lib/alerts.ts` + `src/app/analyst/` |

Three roles (`cardholder`, `analyst`, `admin`) with separate portals, gated by
`src/lib/dal.ts` (`requireRole`) and the optimistic `src/proxy.ts`.

The full transaction workflow (Figure 3.8) lives in `src/lib/transactions.ts`:
**ML score → (face check if escalated) → geo check → composite decision → persist → alert.**

---

## Getting started

### 1. Environment
`.env.local` already contains the MongoDB Atlas URI and a generated `SESSION_SECRET`.
See `.env.example` for the format. (For a fresh database, set `MONGODB_URI` to your own
Atlas connection string.)

### 2. Install & seed
```bash
npm install
npm run seed     # creates demo accounts + sample transactions/alerts (RESETS the DB)
```

### 3. Run
```bash
npm run dev      # http://localhost:3000
```

### Demo logins (password: `password123`)
| Email | Role |
|---|---|
| `admin@demo.test` | System Administrator |
| `analyst@demo.test` | Bank Fraud Analyst |
| `cardholder@demo.test` | Cardholder |

> The camera requires a secure context — `localhost` (dev) and HTTPS (production) both work.

---

## Demo script (for the defense)

1. **Enroll** — sign in as the cardholder → *Enrollment* → register a card + capture your face.
2. **Low-risk** — *New Transaction* → small groceries amount → auto-**approved** (ML only).
3. **High-risk + biometric** — large `cash_advance` amount → triggers a **live face check**;
   match → composite decision; a different face → **rejected**.
4. **Geolocation** — set *Simulated IP* to a foreign IP (e.g. `8.8.8.8`) → geolocation risk.
5. **Analyst** — sign in as the analyst → review the alert → resolve / dismiss.
6. **Admin** — sign in as the admin → adjust risk thresholds, manage roles, view the audit log.
7. **Metrics** — run `../docs/ml_notebook/fraud_model_training.ipynb` in Google Colab for
   accuracy / precision / recall / F1.

---

## Machine-learning model

The deployed model is a **logistic regression** over interpretable features the app computes
at inference time (`src/lib/ml/features.ts`). Train it and obtain report metrics with the
Colab notebook in `../docs/ml_notebook/`, then paste the exported coefficients into
`src/lib/ml/coefficients.ts` — the app and the report then use the identical model.

---

## Deploy to Vercel (optional)

1. Push this `web/` folder to a GitHub repo.
2. Import it at [vercel.com/new](https://vercel.com/new) (root directory = `web`).
3. Add environment variables `MONGODB_URI` and `SESSION_SECRET` (and optionally `GEO_API_BASE`).
4. In MongoDB Atlas, allow access from `0.0.0.0/0` (or Vercel's IP ranges).
5. Deploy. The face-api model files in `public/models` ship automatically.

---

## Project scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run seed` | Reset + seed demo accounts and sample data |
| `npm run lint` | ESLint |
