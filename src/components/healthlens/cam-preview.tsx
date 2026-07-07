import type { MsmeCase } from "@/lib/types";
import { formatInr, formatDateTime, sourceLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { missingEvidence, policyGates, primaryConcern, primaryStrength } from "@/lib/case-insights";

export function CamPreview({ data }: { data: MsmeCase }) {
  return (
    <div className="mx-auto max-w-[920px] p-4 md:p-6">
      <div className="mb-3 flex items-center justify-between gap-3" data-no-print="true">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Credit Assessment Memo
          </div>
          <div className="text-base font-semibold">Print-ready preview</div>
        </div>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" />
          Print / Export
        </Button>
      </div>

      <article className="print-page rounded-md border border-border bg-surface p-6 md:p-10 shadow-sm">
        <header className="flex items-start justify-between border-b border-border pb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              IDBI Bank · MSME HealthLens
            </div>
            <h1 className="mt-1 text-xl font-bold">Credit Assessment Memo</h1>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Case {data.id} · Generated {formatDateTime(new Date().toISOString())}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Decision
            </div>
            <div className="mt-1 text-2xl font-bold text-primary">{data.decision}</div>
            <div className="text-xs text-muted-foreground">Risk band {data.riskBand}</div>
          </div>
        </header>

        <Section title="1. Borrower profile">
          <KV
            pairs={[
              ["Legal name", data.legalName],
              ["Constitution", data.constitution],
              ["Sector / cluster", `${data.sector} · ${data.clusterCity}`],
              ["Vintage", `${data.vintageMonths} months`],
              ["GSTIN", data.gstin ?? "—"],
              ["Udyam", data.udyamId ?? "—"],
              [
                "Segment flags",
                [
                  data.womenOwned ? "Women-owned" : null,
                  data.ntcNtb ? "NTC/NTB" : null,
                  data.existingIdbiCustomer ? "Existing IDBI customer" : "New to IDBI",
                ]
                  .filter(Boolean)
                  .join(" · ") || "—",
              ],
            ]}
          />
        </Section>

        <Section title="2. Data sources used">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {data.dataCompleteness.map((d) => (
              <li
                key={d.source}
                className="flex items-center justify-between border-b border-dashed border-border py-1"
              >
                <span>{sourceLabel[d.source]}</span>
                <span className="text-muted-foreground">
                  {d.available
                    ? `${d.monthsCovered ?? ""}${d.monthsCovered ? "m" : "available"}`
                    : "unavailable"}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="3. Officer summary">
          <KV
            pairs={[
              ["Primary strength", primaryStrength(data)],
              ["Primary concern", primaryConcern(data)],
              ["Missing evidence", missingEvidence(data)],
              [
                "Officer action",
                data.decision === "Approve" ? "Accept / export CAM" : "Review before sanction",
              ],
            ]}
          />
        </Section>

        <Section title="4. Score & limit recommendation">
          <KV
            pairs={[
              ["HealthScore (0–100)", `${data.healthScore} · Band ${data.riskBand}`],
              ["Credit-style score (300–900)", String(data.creditStyleScore)],
              [
                "Recommended limit",
                data.recommendedLimit > 0 ? formatInr(data.recommendedLimit) : "—",
              ],
              ["Requested", formatInr(data.requestedAmount)],
              ["Tenor", data.tenorMonths ? `${data.tenorMonths} months` : "—"],
              ["Detected need", data.detectedBusinessNeed],
              ["Product route", data.productRoute],
              ["Route reason", data.productRouteReason],
              ["Peer / cluster percentile", `P${data.peerClusterPercentile}`],
            ]}
          />
        </Section>

        <Section title="5. Reason codes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <ReasonGroup
              title="Positive"
              reasons={data.reasonCodes.filter((r) => r.polarity === "positive")}
              positive
            />
            <ReasonGroup
              title="Negative"
              reasons={data.reasonCodes.filter((r) => r.polarity === "negative")}
            />
          </div>
        </Section>

        <Section title="6. Policy gates">
          <ul className="grid grid-cols-1 gap-1 text-sm md:grid-cols-2">
            {policyGates(data).map((gate) => (
              <li
                key={gate.label}
                className="flex items-start justify-between gap-3 border-b border-dashed border-border py-1"
              >
                <span>{gate.label}</span>
                <span className="text-right text-muted-foreground">
                  {gate.status} · {gate.detail}
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="7. Fraud & data-quality flags">
          {data.fraudFlags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fraud or data-quality flags raised.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.fraudFlags.map((f) => (
                <li key={f.code} className="flex items-start gap-2">
                  <span className="font-mono text-[10px] uppercase border border-border rounded px-1.5 py-0.5">
                    {f.severity}
                  </span>
                  <span>
                    <span className="font-medium">{f.label}</span>{" "}
                    <span className="text-muted-foreground">({f.code})</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="8. Officer override">
          <div className="rounded-md border border-dashed border-border px-3 py-6 text-xs text-muted-foreground">
            ▢ Accept engine recommendation &nbsp;&nbsp; ▢ Override to: _______________
            <br />
            <br />
            Reason: ________________________________________________________
            <br />
            <br />
            Officer name &amp; signature: ________________________________ Date: __________
          </div>
        </Section>

        <Section title="9. Audit references">
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            {data.audit.map((e, i) => (
              <li key={i}>
                <span className="tabular-nums">{formatDateTime(e.ts)}</span> · {e.actor} ·{" "}
                {e.action}
                {e.detail && ` — ${e.detail}`}
              </li>
            ))}
          </ul>
        </Section>

        <footer className="mt-8 border-t border-border pt-3 text-[10px] text-muted-foreground leading-relaxed">
          Prepared by HealthLens for officer review; acceptance, rejection, or override remains with
          IDBI's authorised credit officer. HealthLens is a decision-support and configurable
          recommendation engine. IDBI remains the regulated entity and final decision owner. All
          figures derive from consented alternate data sources for the stated 12-month window.
          Synthetic prototype data — not for live decisioning.
        </footer>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function KV({ pairs }: { pairs: Array<[string, string]> }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-[180px_minmax(0,1fr)] gap-y-1 text-sm">
      {pairs.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function ReasonGroup({
  title,
  reasons,
  positive,
}: {
  title: string;
  reasons: import("@/lib/types").ReasonCode[];
  positive?: boolean;
}) {
  return (
    <div>
      <div className={`text-xs font-semibold mb-1 ${positive ? "text-positive" : "text-negative"}`}>
        {title} ({reasons.length})
      </div>
      <ul className="space-y-0.5">
        {reasons.length === 0 && <li className="text-muted-foreground text-xs">None.</li>}
        {reasons.map((r) => (
          <li key={r.code}>
            {positive ? "+ " : "− "}
            {r.label}
            <span className="font-mono text-[10px] text-muted-foreground"> ({r.code})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
