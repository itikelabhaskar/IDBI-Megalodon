import { useRef, useState } from "react";
import type { MsmeCase, Decision } from "@/lib/types";
import { useRole } from "@/lib/role-context";
import { useWorkflow, useCaseWorkflow, statusTone, type CaseStatus } from "@/lib/workflow";
import { makerGateMessage, requiresForcedChecker } from "@/lib/workflow-gates";
import { cn } from "@/lib/utils";
import { decisionToneSolid } from "@/lib/format";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ClipboardCheck,
  UserCheck,
  ShieldCheck,
  Undo2,
  Paperclip,
  Trash2,
  MessageSquarePlus,
  Send,
  AlertTriangle,
} from "lucide-react";

const ACTORS: Record<string, string> = {
  "Credit Officer": "Vikram Rao (Credit Officer)",
  "Risk Admin": "Priya Nair (Risk Admin)",
};

const DECISIONS: Decision[] = ["Approve", "Refer", "Reject", "Incomplete"];

function StatusChip({ status }: { status: CaseStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        statusTone[status],
      )}
    >
      {status}
    </span>
  );
}

export function DecisionWorkflowPanel({ data }: { data: MsmeCase }) {
  const { role } = useRole();
  const actor = ACTORS[role] ?? role;
  const wf = useCaseWorkflow(data.id);
  const { recordDecision, checkerSanction, checkerReturn, addNote, addDoc, removeDoc } =
    useWorkflow();

  const [decision, setDecision] = useState<Decision>(data.decision);
  const [reason, setReason] = useState("");
  const [checkerNote, setCheckerNote] = useState("");
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const isMaker = role === "Credit Officer";
  const isChecker = role === "Risk Admin";
  const awaitingChecker = wf.status === "Pending checker";
  const forcedHitl = requiresForcedChecker(data.confidence.level, data.decision);
  const gateMsg = makerGateMessage(data.confidence.level, decision);

  const submitDecision = () => {
    if (!reason.trim()) {
      toast.error("A recommendation reason is mandatory.");
      return;
    }
    if (data.confidence.level === "Low" && decision === "Approve" && reason.trim().length < 12) {
      toast.error("Low confidence Approve requires a detailed reason for the checker.");
      return;
    }
    recordDecision(data.id, decision, reason.trim(), actor);
    setReason("");
    toast.success("Recommendation recorded — routed to checker for four-eyes review.");
  };

  const sanction = () => {
    checkerSanction(data.id, actor, checkerNote.trim());
    setCheckerNote("");
    toast.success(
      wf.makerDecision === "Incomplete"
        ? "Incomplete confirmed — returned for data gathering."
        : "Decision sanctioned and logged.",
    );
  };
  const sendBack = () => {
    if (!checkerNote.trim()) {
      toast.error("Add a note explaining what the maker should revisit.");
      return;
    }
    checkerReturn(data.id, actor, checkerNote.trim());
    setCheckerNote("");
    toast.message("Returned to maker for rework.");
  };

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    for (const f of Array.from(files)) addDoc(data.id, f.name, f.size, actor);
    if (files.length) toast.success(`${files.length} document(s) attached to the case file.`);
    if (fileRef.current) fileRef.current.value = "";
  };

  const addComment = () => {
    if (!note.trim()) return;
    addNote(data.id, actor, note.trim());
    setNote("");
  };

  return (
    <section className="rounded-md border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Decision &amp; workflow</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Status</span>
          <StatusChip status={wf.status} />
        </div>
      </div>

      {forcedHitl && (
        <div className="flex items-start gap-2 border-b border-accent/30 bg-accent/10 px-4 py-2.5 text-[11px] text-foreground">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-foreground" />
          <p>
            <span className="font-semibold">Four-eyes interrupt.</span> Assessment confidence is{" "}
            <span className="font-semibold">{data.confidence.level}</span>
            {data.decision === "Incomplete" ? " and evidence is Incomplete" : ""}. Maker
            recommendations route to Risk Admin — no straight-through sanction.
          </p>
        </div>
      )}

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div className="rounded-md border border-border bg-background p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <UserCheck className="h-3.5 w-3.5 text-primary" />
            Maker — record recommendation
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Engine recommends <span className="font-semibold text-foreground">{data.decision}</span>
            . The officer owns the final call; every action is logged to the audit trail.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {DECISIONS.map((d) => (
              <button
                key={d}
                type="button"
                disabled={!isMaker}
                onClick={() => setDecision(d)}
                className={cn(
                  "rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
                  decision === d
                    ? decisionToneSolid[d]
                    : "border-border bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                {d}
              </button>
            ))}
          </div>
          {gateMsg && <p className="mt-2 text-[10px] text-accent-foreground">{gateMsg}</p>}
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={!isMaker}
            placeholder="Reason for the recommendation (mandatory)…"
            className="mt-2 min-h-16 text-xs"
          />
          <Button size="sm" className="mt-2 w-full" disabled={!isMaker} onClick={submitDecision}>
            <Send className="mr-1.5 h-3.5 w-3.5" />
            {isMaker ? "Record & route to checker" : "Maker action (Credit Officer only)"}
          </Button>
        </div>

        <div className="rounded-md border border-border bg-background p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Checker — sanction (four-eyes)
          </div>
          {wf.makerDecision ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Maker recommended{" "}
              <span className="font-semibold text-foreground">{wf.makerDecision}</span> —{" "}
              {wf.makerBy}. {wf.makerReason}
            </p>
          ) : (
            <p className="mt-1 text-[11px] text-muted-foreground">
              No recommendation recorded yet. A checker can sanction once the maker submits.
            </p>
          )}
          <Textarea
            value={checkerNote}
            onChange={(e) => setCheckerNote(e.target.value)}
            disabled={!isChecker || !awaitingChecker}
            placeholder="Checker note (required to return)…"
            className="mt-2 min-h-16 text-xs"
          />
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={!isChecker || !awaitingChecker}
              onClick={sendBack}
            >
              <Undo2 className="mr-1.5 h-3.5 w-3.5" />
              Return
            </Button>
            <Button size="sm" disabled={!isChecker || !awaitingChecker} onClick={sanction}>
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              {wf.makerDecision === "Incomplete" ? "Confirm Incomplete" : "Sanction"}
            </Button>
          </div>
          {!isChecker && (
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Switch role to <span className="font-medium">Risk Admin</span> to act as checker.
            </p>
          )}
          {wf.checkerBy && (
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              {wf.status} by {wf.checkerBy}
              {wf.checkerNote ? ` — ${wf.checkerNote}` : ""}
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Paperclip className="h-3.5 w-3.5 text-primary" />
            Supporting documents ({wf.docs.length})
          </div>
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
            <Paperclip className="mr-1.5 h-3.5 w-3.5" />
            Attach
          </Button>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </div>
        {wf.docs.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {wf.docs.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px]"
              >
                <span className="min-w-0 truncate text-foreground">{d.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {(d.size / 1024).toFixed(0)} KB · {d.by}
                </span>
                <button
                  type="button"
                  onClick={() => removeDoc(data.id, d.id)}
                  className="shrink-0 text-muted-foreground hover:text-band-d"
                  aria-label="Remove document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[11px] text-muted-foreground">
            No documents attached. Officers can request and attach bank statements, GST returns or
            KYC here (synthetic build — files are listed locally, not uploaded).
          </p>
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <MessageSquarePlus className="h-3.5 w-3.5 text-primary" />
          Case notes ({wf.notes.length})
        </div>
        <div className="mt-2 flex gap-2">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note for the file / next reviewer…"
            className="min-h-10 flex-1 text-xs"
          />
          <Button size="sm" onClick={addComment} className="self-end">
            Add
          </Button>
        </div>
        {wf.notes.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {wf.notes.map((n) => (
              <li
                key={n.id}
                className="rounded-md border border-border bg-background px-2.5 py-1.5"
              >
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="font-medium text-foreground">{n.author}</span>
                  <span>{new Date(n.ts).toLocaleString("en-IN")}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-foreground/90">{n.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
