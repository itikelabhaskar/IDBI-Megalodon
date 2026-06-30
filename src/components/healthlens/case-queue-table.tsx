import type { MsmeCase } from "@/lib/types";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo, useState } from "react";
import { RiskBandChip } from "./risk-band-chip";
import { DecisionPill } from "./decision-pill";
import { DataCompletenessStrip } from "./data-completeness-strip";
import { formatInrCompact } from "@/lib/format";
import { Search } from "lucide-react";

const ALL = "all";

export function CaseQueueTable({ cases }: { cases: MsmeCase[] }) {
  const [q, setQ] = useState("");
  const [sector, setSector] = useState<string>(ALL);
  const [cluster, setCluster] = useState<string>(ALL);
  const [decision, setDecision] = useState<string>(ALL);
  const [band, setBand] = useState<string>(ALL);

  const sectors = useMemo(() => Array.from(new Set(cases.map((c) => c.sector))).sort(), [cases]);
  const clusters = useMemo(
    () => Array.from(new Set(cases.map((c) => c.clusterCity))).sort(),
    [cases],
  );

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return cases.filter((c) => {
      if (t && !`${c.legalName} ${c.id} ${c.gstin ?? ""}`.toLowerCase().includes(t)) return false;
      if (sector !== ALL && c.sector !== sector) return false;
      if (cluster !== ALL && c.clusterCity !== cluster) return false;
      if (decision !== ALL && c.decision !== decision) return false;
      if (band !== ALL && c.riskBand !== band) return false;
      return true;
    });
  }, [cases, q, sector, cluster, decision, band]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(200px,1fr)_repeat(4,minmax(0,auto))]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, ID, GSTIN…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 pl-8 bg-surface"
          />
        </div>
        <Filter value={sector} onChange={setSector} placeholder="Sector" options={sectors} />
        <Filter value={cluster} onChange={setCluster} placeholder="Cluster" options={clusters} />
        <Filter
          value={decision}
          onChange={setDecision}
          placeholder="Decision"
          options={["Approve", "Refer", "Reject"]}
        />
        <Filter
          value={band}
          onChange={setBand}
          placeholder="Risk band"
          options={["A", "B", "C", "D"]}
        />
      </div>

      <div className="rounded-md border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[240px]">Borrower</TableHead>
                <TableHead className="text-right">Health</TableHead>
                <TableHead className="text-right">Credit-style</TableHead>
                <TableHead className="text-right">Requested</TableHead>
                <TableHead className="text-right">Recommended</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Red flag</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const flag =
                  c.fraudFlags.find((f) => f.severity === "high") ??
                  c.fraudFlags.find((f) => f.severity === "warn") ??
                  c.reasonCodes.find((r) => r.polarity === "negative");
                return (
                  <TableRow key={c.id} className="group">
                    <TableCell className="py-2.5">
                      <Link
                        to="/cases/$id"
                        params={{ id: c.id }}
                        className="block min-w-0 group-hover:text-primary"
                      >
                        <div className="text-sm font-medium text-foreground truncate">
                          {c.legalName}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {c.sector} · {c.clusterCity} · {c.id}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="tabular-nums font-medium">{c.healthScore}</span>
                        <RiskBandChip band={c.riskBand} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{c.creditStyleScore}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatInrCompact(c.requestedAmount)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {c.recommendedLimit > 0 ? formatInrCompact(c.recommendedLimit) : "—"}
                    </TableCell>
                    <TableCell>
                      <DecisionPill decision={c.decision} />
                    </TableCell>
                    <TableCell className="text-xs">{c.productRoute}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                      {flag ? ("label" in flag ? flag.label : "") : "—"}
                    </TableCell>
                    <TableCell>
                      <DataCompletenessStrip items={c.dataCompleteness} showLabels={false} />
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                    No cases match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground">
        {filtered.length} of {cases.length} cases
      </div>
    </div>
  );
}

function Filter({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 bg-surface min-w-[140px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {placeholder.toLowerCase()}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
