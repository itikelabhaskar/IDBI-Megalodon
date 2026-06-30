import type { MsmeCase } from "@/lib/types";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { formatInrCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Search, ListFilter, Check, ChevronUp, ChevronDown, ChevronsUpDown, X } from "lucide-react";

const ALL = "all";

type SortKey = "name" | "health" | "creditStyle" | "requested" | "recommended";

export function CaseQueueTable({ cases }: { cases: MsmeCase[] }) {
  const [q, setQ] = useState("");
  const [sector, setSector] = useState<string>(ALL);
  const [cluster, setCluster] = useState<string>(ALL);
  const [decision, setDecision] = useState<string>(ALL);
  const [band, setBand] = useState<string>(ALL);
  const [route, setRoute] = useState<string>(ALL);
  const [sortKey, setSortKey] = useState<SortKey>("health");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sectors = useMemo(() => Array.from(new Set(cases.map((c) => c.sector))).sort(), [cases]);
  const clusters = useMemo(
    () => Array.from(new Set(cases.map((c) => c.clusterCity))).sort(),
    [cases],
  );
  const routes = useMemo(
    () => Array.from(new Set(cases.map((c) => c.productRoute))).sort(),
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
      if (route !== ALL && c.productRoute !== route) return false;
      return true;
    });
  }, [cases, q, sector, cluster, decision, band, route]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const arr = [...filtered];
    arr.sort((a, b) => {
      if (sortKey === "name") return dir * a.legalName.localeCompare(b.legalName);
      const pick = (c: MsmeCase) =>
        sortKey === "health"
          ? c.healthScore
          : sortKey === "creditStyle"
            ? c.creditStyleScore
            : sortKey === "requested"
              ? c.requestedAmount
              : c.recommendedLimit;
      return dir * (pick(a) - pick(b));
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(k: SortKey) {
    if (sortKey === k) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(k);
      setSortDir(k === "name" ? "asc" : "desc");
    }
  }

  const activeFilters = [
    sector !== ALL && { label: `Sector: ${sector}`, clear: () => setSector(ALL) },
    cluster !== ALL && { label: `Cluster: ${cluster}`, clear: () => setCluster(ALL) },
    decision !== ALL && { label: `Decision: ${decision}`, clear: () => setDecision(ALL) },
    band !== ALL && { label: `Band: ${band}`, clear: () => setBand(ALL) },
    route !== ALL && { label: `Route: ${route}`, clear: () => setRoute(ALL) },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const clearAll = () => {
    setSector(ALL);
    setCluster(ALL);
    setDecision(ALL);
    setBand(ALL);
    setRoute(ALL);
  };

  const sortProps = { sortKey, sortDir, onSort: toggleSort };

  return (
    <div className="space-y-3">
      {/* Slim toolbar: search + active filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, ID, GSTIN…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 pl-8 bg-surface"
          />
        </div>
        {activeFilters.map((f) => (
          <button
            key={f.label}
            type="button"
            onClick={f.clear}
            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary/10"
          >
            {f.label}
            <X className="h-3 w-3" />
          </button>
        ))}
        {activeFilters.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="rounded-md border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="min-w-[240px]">
                  <div className="flex items-center gap-2">
                    <SortHeader label="Borrower" k="name" {...sortProps} />
                    <BorrowerFilter
                      sector={sector}
                      cluster={cluster}
                      sectors={sectors}
                      clusters={clusters}
                      onSector={setSector}
                      onCluster={setCluster}
                    />
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <ColumnFilter
                      label="Band"
                      value={band}
                      onChange={setBand}
                      options={["A", "B", "C", "D"]}
                      align="end"
                    />
                    <SortHeader label="Health" k="health" align="right" {...sortProps} />
                  </div>
                </TableHead>
                <TableHead className="text-right">
                  <SortHeader label="Credit-style" k="creditStyle" align="right" {...sortProps} />
                </TableHead>
                <TableHead className="text-right">
                  <SortHeader label="Requested" k="requested" align="right" {...sortProps} />
                </TableHead>
                <TableHead className="text-right">
                  <SortHeader label="Recommended" k="recommended" align="right" {...sortProps} />
                </TableHead>
                <TableHead>
                  <ColumnFilter
                    label="Decision"
                    value={decision}
                    onChange={setDecision}
                    options={["Approve", "Refer", "Reject"]}
                  />
                </TableHead>
                <TableHead>
                  <ColumnFilter label="Route" value={route} onChange={setRoute} options={routes} />
                </TableHead>
                <TableHead>Red flag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((c) => {
                const flag =
                  c.fraudFlags.find((f) => f.severity === "high") ??
                  c.fraudFlags.find((f) => f.severity === "warn") ??
                  c.reasonCodes.find((r) => r.polarity === "negative");
                const avail = c.dataCompleteness.filter((d) => d.available).length;
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
                          {c.sector} · {c.clusterCity} · {avail}/{c.dataCompleteness.length} sources
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        <span className="tabular-nums font-medium">{c.healthScore}</span>
                        <RiskBandChip band={c.riskBand} compact />
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
                    <TableCell className="text-xs whitespace-nowrap">{c.productRoute}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                      {flag ? ("label" in flag ? flag.label : "") : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                    No cases match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="text-[11px] text-muted-foreground">
        {sorted.length} of {cases.length} cases
      </div>
    </div>
  );
}

function SortHeader({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
  align = "left",
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sortKey === k;
  const Icon = active ? (sortDir === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <button
      type="button"
      onClick={() => onSort(k)}
      className={cn(
        "inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground",
        align === "right" && "flex-row-reverse",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
      <Icon className={cn("h-3.5 w-3.5", active ? "opacity-100" : "opacity-40")} />
    </button>
  );
}

function ColumnFilter({
  label,
  value,
  onChange,
  options,
  align = "start",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  align?: "start" | "end";
}) {
  const active = value !== ALL;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground",
            active ? "text-primary" : "text-muted-foreground",
          )}
        >
          {active ? value : label}
          <ListFilter className={cn("h-3 w-3", active ? "opacity-100" : "opacity-50")} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="max-h-72 w-44 overflow-auto">
        <DropdownMenuItem onClick={() => onChange(ALL)}>
          <span className="flex-1">All {label.toLowerCase()}</span>
          {value === ALL && <Check className="h-3.5 w-3.5" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {options.map((o) => (
          <DropdownMenuItem key={o} onClick={() => onChange(o)}>
            <span className="flex-1 truncate">{o}</span>
            {value === o && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BorrowerFilter({
  sector,
  cluster,
  sectors,
  clusters,
  onSector,
  onCluster,
}: {
  sector: string;
  cluster: string;
  sectors: string[];
  clusters: string[];
  onSector: (v: string) => void;
  onCluster: (v: string) => void;
}) {
  const active = sector !== ALL || cluster !== ALL;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Filter by sector / cluster"
          className={cn(
            "inline-flex items-center transition-colors hover:text-foreground",
            active ? "text-primary" : "text-muted-foreground/70",
          )}
        >
          <ListFilter className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-52 overflow-auto">
        <DropdownMenuLabel>Sector</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onSector(ALL)}>
          <span className="flex-1">All sectors</span>
          {sector === ALL && <Check className="h-3.5 w-3.5" />}
        </DropdownMenuItem>
        {sectors.map((s) => (
          <DropdownMenuItem key={s} onClick={() => onSector(s)}>
            <span className="flex-1 truncate">{s}</span>
            {sector === s && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Cluster</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onCluster(ALL)}>
          <span className="flex-1">All clusters</span>
          {cluster === ALL && <Check className="h-3.5 w-3.5" />}
        </DropdownMenuItem>
        {clusters.map((c) => (
          <DropdownMenuItem key={c} onClick={() => onCluster(c)}>
            <span className="flex-1 truncate">{c}</span>
            {cluster === c && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
