import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Decision } from "@/lib/types";

export function OfficerOverrideDialog({
  decision,
  trigger,
}: {
  decision: Decision;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [next, setNext] = useState<Decision>(decision === "Approve" ? "Refer" : "Approve");
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Override engine recommendation</DialogTitle>
          <DialogDescription>
            Overrides are logged to the audit trail. A reason is mandatory.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">New decision</Label>
            <RadioGroup
              value={next}
              onValueChange={(v) => setNext(v as Decision)}
              className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4"
            >
              {(["Approve", "Refer", "Incomplete", "Reject"] as Decision[]).map((d) => (
                <Label
                  key={d}
                  className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-2 text-xs cursor-pointer has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <RadioGroupItem value={d} className="h-3.5 w-3.5" />
                  {d}
                </Label>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-xs" htmlFor="reason">
              Reason <span className="text-band-d">*</span>
            </Label>
            <Textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Verified additional GST returns offline; cluster collateral available."
              className="mt-1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={reason.trim().length < 8 || next === decision}
            onClick={() => {
              toast.success(`Override recorded: ${decision} → ${next}`, {
                description: "Audit entry added (prototype).",
              });
              setOpen(false);
              setReason("");
            }}
          >
            Record override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
