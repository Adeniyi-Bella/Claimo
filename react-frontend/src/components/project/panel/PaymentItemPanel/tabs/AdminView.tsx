import { ShieldCheck } from "lucide-react";
import type { PaymentItem, JobStatus } from "@/api/dto/responseDto";
import { HardHat } from "lucide-react";

export function AdminView({ item }: { item: PaymentItem }) {

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-3 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <HardHat className="h-3 w-3" /> Job Status
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as JobStatus[]).map((s) => (
            <button
              key={s}
              disabled
              className={`h-7 rounded text-[11px] font-medium transition border opacity-40 cursor-not-allowed
                ${item.jobStatus === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border"}`}
            >
              {s === "NOT_STARTED" ? "Not Started" : s === "IN_PROGRESS" ? "In Progress" : "Completed"}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-md border border-border bg-surface-elevated p-3 text-xs text-muted-foreground flex items-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5" /> Admins set scope and assignments. Approvals are made by the assigned approver.
      </div>
    </div>
  );
}