# IDBI MSME HealthLens

Credit-officer workbench for MSME lending under IDBI Innovate 2026 Track 03 (Financial Inclusion / Digital Lending / Credit Decisioning).

HealthLens produces an explainable **MSME Financial Health Card** from consented alternate data — GST, Account Aggregator bank, UPI, EPFO, DISCOM power, fuel / ops spend, and bureau-lite — then maps it to a Go / Conditional / No-Go recommendation, limit, and product route. The officer remains the decision owner; the ML proxy is advisory only.

**Live:** https://idbi-megalodon.vercel.app

## Capabilities

- Portfolio dashboard — book KPIs, decision / risk mix, credit-invisible inclusion funnel
- Case queue — lead filters, HealthScore, recommended limit, next action
- Case workbench — Health Card, Decision (maker–checker), Applicant guidance, Explainability (policy weights + ML contributions), Fraud & triangulation, Consent, CAM
- Score applicant — live recompute on alternate-data inputs
- Governance — champion–challenger, fairness slices, model card, connector rail status
- Architecture — end-to-end data flow and integration surface (ULI / OCEN-ready contracts)

All case figures in this build are **synthetic**. Connectors are labelled Synthetic in-app; there is no live bureau / ULI / OCEN / FASTag claim.

## Stack

- TanStack Start (React 19) + Vite
- TypeScript, Tailwind CSS v4, shadcn/ui
- Recharts, Zod, Vitest

## Setup

```bash
npm install
npm run dev
npm run build
npm test
```

Node 22.x required (`engines` in `package.json`).

## Repository

| Path | Role |
|------|------|
| `src/routes/` | App pages (file-based routing) |
| `src/components/healthlens/` | Workbench UI |
| `src/lib/types.ts` | `MsmeCase` contract |
| `src/lib/data/` | Synthetic MSME generator |
| `src/lib/scoring/` | Features, scorecard, ML proxy, BRE / decisioning |
| `src/lib/connectors/` | AA / GSTN / UPI / EPFO / DISCOM / fuel / bureau connectors |
| `src/lib/api/` | Zod-validated ULI / OCEN-style scoring APIs |
| `docs/` | Problem statement, model card, demo script |

## Documentation

- `docs/problem.md` — Track 03 problem statement
- `docs/model-card.md` — synthetic held-out metrics (`npm run train`)
- `docs/DEMO_SCRIPT.md` — officer walkthrough

## Deploy

Default target is Vercel (`NITRO_PRESET=vercel`). Build emits `.vercel/output`.

```bash
npm run build
```

Other Nitro presets (`node-server`, `aws-lambda`, `cloudflare-module`) are supported for alternate hosts. No managed datastore is required for the synthetic book.
