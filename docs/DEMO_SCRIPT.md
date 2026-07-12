# HealthLens demo script (live workbench)

Live URL: [https://idbi-megalodon.vercel.app](https://idbi-megalodon.vercel.app)

Use Featured demo cases on the home dashboard, or open **Case queue**. Aim for ~8–10 minutes.

## Story arc

1. **Power / fuel authenticity** — open a fraud-suspect or power-mismatch case → Fraud tab → triangulation + Authenticity band.
2. **Credit-invisible / Incomplete** — open an NTC thin-file → Decision tab → Incomplete or Refer, Path-to-credit + Scheme readiness.
3. **Maker–checker** — maker records decision; Low confidence / Incomplete forces checker; sanction with reason.
4. **Governance honesty** — Credit-invisible lift, reconciliation rates, rails Synthetic→Sandbox→Live, ablation note.

## Click path

| Step | Route | Show |
|------|-------|------|
| 1 | `/` | Credit-invisible lift KPI, recon mismatch rates, featured demos |
| 2 | `/queue` | Filter Decision = Reject / Incomplete; open a fraud-heavy case |
| 3 | `/cases/$id/fraud` | GST–bank + power/fuel triangulation; Authenticity · Weak/Strong |
| 4 | `/cases/$id` | Health Card authenticity chip; Mode B monitoring pane |
| 5 | `/cases/$id/decision` | Go/No-Go, workflow gates, Path-to-credit + Scheme readiness |
| 6 | `/governance` | Lift tile, recon, ablation, connector rails list |
| 7 | `/architecture` | Same rails roster — stub honesty |

## Talking points (AMA-aligned)

- Missing power/fuel does **not** invent signal; presence-gated ops + Incomplete when evidence is thin.
- NTC is **not** auto-rejected; inclusion lift is measured on the book.
- Officer owns the decision; ML proxy never auto-sanctions.
- All connectors labelled Synthetic until IDBI sandbox swap.

## Avoid

- Claiming live bureau / ULI / FASTag.
- Quoting model-card AUC as production performance.
