# Setup gaps — what is not live yet

Honest inventory for IDBI Innovate judges and pilot planners. HealthLens is a **decision-support prototype** on synthetic data. Nothing below is a production claim.

## Live today

- Workbench: [https://idbi-megalodon.vercel.app](https://idbi-megalodon.vercel.app)
- Synthetic MSME book → HealthScore, BRE (Approve / Refer / Reject / Incomplete), CAM, maker–checker
- Connector stubs with stable payload shapes (`src/lib/connectors/`)
- Model card metrics on **synthetic** held-out data only — see `docs/model-card.md`

## Gaps before a bank pilot

| Area | Current state | Needed for sandbox |
|------|---------------|--------------------|
| Account Aggregator | Synthetic AA envelope | ReBIT-compliant FIU credentials + consent artefact store |
| GSTN-as-FIP | Stub from generator | Partner sandbox GST returns |
| UPI / EPFO / DISCOM | Stub | Aggregator + DISCOM MoU feeds |
| Fuel / FASTag / e-way | Synthetic labelled mocks | Ops-cost / toll / e-way sandbox (optional AMA depth) |
| Bureau-lite | Stub | CIR / commercial bureau thin-file API |
| ULI / OCEN | Schema-ready stubs | Live ULI health-card + OCEN loan APIs |
| Identity / IAM | Same-app demo roles | IDBI SSO / maker–checker identity |
| Model calibration | Synthetic AUC/KS in model card | Refit + calibrate on anonymised IDBI book |
| Monitoring | Mode B hints on Health Card | Portfolio watch jobs + renewal calendar |

## Explicit non-claims

- No live ULI / OCEN / FASTag / e-way connectivity in this demo.
- No production AUROC badge — model-card AUC is synthetic-illustrative.
- Incomplete is a first-class BRE outcome when alternate-data evidence is thin.

## Swap path

Replace functions in `src/lib/connectors/*` with sandbox HTTP clients; keep `MsmeCase` and the scoring pipeline unchanged. Rails status in Governance / Architecture lists every rail as **Synthetic · stub** until swapped.
