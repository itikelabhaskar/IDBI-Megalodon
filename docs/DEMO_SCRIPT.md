# HealthLens demo script (live workbench)

Live URL: [https://idbi-megalodon.vercel.app](https://idbi-megalodon.vercel.app)

Use Featured demo cases on the home dashboard, or open **Case queue**. Aim for ~8–10 minutes.

## Story arc

1. **Inclusion funnel** — dashboard Inclusion panel + Credit-invisible lift KPI (bureau-thin baseline vs HealthLens keep rate).
2. **Power / fuel authenticity** — fraud-suspect case → Fraud tab → triangulation + Authenticity band + trade/payment concentration.
3. **Credit-invisible coaching** — NTC thin-file → **Applicant guidance** tab (path-to-credit, schemes, what-if) then Decision for Go/No-Go.
4. **Policy weight view** — Explainability → how present rails re-normalise into HealthScore (not a WOE table).
5. **Maker–checker** — maker records decision; Low confidence / Incomplete forces checker.
6. **Governance honesty** — lift, recon, rails Synthetic→Sandbox→Live, ablation note.

## Click path

| Step | Route | Show |
|------|-------|------|
| 1 | `/` | Inclusion funnel panel, Credit-invisible lift KPI, recon rates, featured demos |
| 2 | `/queue` | Filter Decision = Reject / Incomplete; open a fraud-heavy case |
| 3 | `/cases/$id/fraud` | Triangulation; Authenticity; **Trade & payment concentration** |
| 4 | `/cases/$id` | Health Card authenticity chip; Mode B monitoring pane |
| 5 | `/cases/$id/guidance` | Applicant guidance — coaching only (no sanction controls) |
| 6 | `/cases/$id/decision` | Go/No-Go, workflow gates |
| 7 | `/cases/$id/explain` | Reason codes + **Policy weight view** + ML SHAP pane |
| 8 | `/governance` | Lift tile, recon, ablation, connector rails list |
| 9 | `/architecture` | Same rails roster — stub honesty |

## Talking points (AMA-aligned)

- Missing power/fuel does **not** invent signal; presence-gated ops + Incomplete when evidence is thin.
- NTC is **not** auto-rejected; inclusion funnel is measured on the book (HealthLens language, not a peer lift badge).
- Applicant guidance is officer-led coaching; sanction stays on Decision.
- Policy weight view shows scorecard re-normalisation — thin files are not punished for absent rails.
- Officer owns the decision; ML proxy never auto-sanctions.
- All connectors labelled Synthetic until IDBI sandbox swap.

## Avoid

- Claiming live bureau / ULI / FASTag.
- Quoting model-card AUC as production performance.
