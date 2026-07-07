// Client-side case-workflow store (localStorage-backed).
//
// A prototype stand-in for the server-side workflow a pilot would persist. It
// gives credit officers a real, stateful maker–checker flow: record a decision,
// route it to a checker, add notes, attach documents, and track status/ageing —
// none of which the pure read-only scoring view could do. All state is local to
// the browser (no backend, DPDP-safe) and keyed by MSME id.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Decision } from "./types";

export type CaseStatus =
  "New" | "In review" | "Pending checker" | "Sanctioned" | "Returned" | "Declined";

export interface CaseNote {
  id: string;
  ts: string;
  author: string;
  text: string;
}

export interface CaseDoc {
  id: string;
  ts: string;
  name: string;
  size: number;
  by: string;
}

export interface CaseWorkflow {
  status: CaseStatus;
  makerDecision?: Decision;
  makerReason?: string;
  makerBy?: string;
  makerAt?: string;
  checkerBy?: string;
  checkerAt?: string;
  checkerNote?: string;
  assignee?: string;
  notes: CaseNote[];
  docs: CaseDoc[];
  updatedAt?: string;
}

type WorkflowMap = Record<string, CaseWorkflow>;

const STORAGE_KEY = "hl.workflow.v1";
const now = () => new Date().toISOString();
const rid = () => Math.random().toString(36).slice(2, 10);

function emptyWorkflow(): CaseWorkflow {
  return { status: "New", notes: [], docs: [] };
}

interface WorkflowContextValue {
  map: WorkflowMap;
  get: (id: string) => CaseWorkflow;
  recordDecision: (id: string, decision: Decision, reason: string, by: string) => void;
  checkerSanction: (id: string, by: string, note: string) => void;
  checkerReturn: (id: string, by: string, note: string) => void;
  addNote: (id: string, author: string, text: string) => void;
  addDoc: (id: string, name: string, size: number, by: string) => void;
  removeDoc: (id: string, docId: string) => void;
  assign: (id: string, assignee: string) => void;
}

const WorkflowContext = createContext<WorkflowContextValue | null>(null);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<WorkflowMap>({});

  // Hydrate from localStorage on the client only (SSR-safe).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMap(JSON.parse(raw) as WorkflowMap);
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  const persist = useCallback((next: WorkflowMap) => {
    setMap(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage full / unavailable — keep in memory */
    }
  }, []);

  const update = useCallback((id: string, fn: (w: CaseWorkflow) => CaseWorkflow) => {
    setMap((prev) => {
      const current = prev[id] ?? emptyWorkflow();
      const next = { ...prev, [id]: { ...fn(current), updatedAt: now() } };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo<WorkflowContextValue>(
    () => ({
      map,
      get: (id) => map[id] ?? emptyWorkflow(),
      recordDecision: (id, decision, reason, by) =>
        update(id, (w) => ({
          ...w,
          status: "Pending checker",
          makerDecision: decision,
          makerReason: reason,
          makerBy: by,
          makerAt: now(),
          checkerBy: undefined,
          checkerAt: undefined,
          checkerNote: undefined,
        })),
      checkerSanction: (id, by, note) =>
        update(id, (w) => ({
          ...w,
          status: w.makerDecision === "Reject" ? "Declined" : "Sanctioned",
          checkerBy: by,
          checkerAt: now(),
          checkerNote: note,
        })),
      checkerReturn: (id, by, note) =>
        update(id, (w) => ({
          ...w,
          status: "Returned",
          checkerBy: by,
          checkerAt: now(),
          checkerNote: note,
        })),
      addNote: (id, author, text) =>
        update(id, (w) => ({
          ...w,
          status: w.status === "New" ? "In review" : w.status,
          notes: [{ id: rid(), ts: now(), author, text }, ...w.notes],
        })),
      addDoc: (id, name, size, by) =>
        update(id, (w) => ({
          ...w,
          docs: [{ id: rid(), ts: now(), name, size, by }, ...w.docs],
        })),
      removeDoc: (id, docId) =>
        update(id, (w) => ({ ...w, docs: w.docs.filter((d) => d.id !== docId) })),
      assign: (id, assignee) =>
        update(id, (w) => ({
          ...w,
          status: w.status === "New" ? "In review" : w.status,
          assignee,
        })),
    }),
    [map, update],
  );

  // persist is used indirectly via update; keep reference to avoid unused lint
  void persist;

  return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}

export function useWorkflow(): WorkflowContextValue {
  const ctx = useContext(WorkflowContext);
  if (!ctx) throw new Error("useWorkflow must be used within WorkflowProvider");
  return ctx;
}

export function useCaseWorkflow(id: string): CaseWorkflow {
  const { get } = useWorkflow();
  return get(id);
}

export const statusTone: Record<CaseStatus, string> = {
  New: "bg-muted text-muted-foreground border-border",
  "In review": "bg-band-b/10 text-band-b border-band-b/30",
  "Pending checker": "bg-accent/15 text-accent-foreground border-accent/40",
  Sanctioned: "bg-band-a/15 text-band-a border-band-a/30",
  Returned: "bg-band-c/15 text-band-c border-band-c/30",
  Declined: "bg-band-d/15 text-band-d border-band-d/30",
};
