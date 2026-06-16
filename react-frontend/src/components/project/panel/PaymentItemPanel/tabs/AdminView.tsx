import { ShieldCheck, HardHat, UserCheck } from "lucide-react";
import { useState } from "react";
import type { PaymentItem, Member } from "@/api/dto/responseDto";
import type { JobStatus } from "@/api/dto/responseDto";
import { useAssignPaymentItem } from "@/hooks/api/paymentItem/usePaymentItem";

export function AdminView({
  item,
  members,
  projectId,
  itemId,
}: {
  item: PaymentItem;
  members: Member[];
  projectId: string;
  itemId: string;
}) {
  const contractors = members.filter((m) => m.role === "CONTRACTOR");
  const approvers = members.filter((m) => m.role === "APPROVER");

  const [contractorId, setContractorId] = useState("");
  const [approverId, setApproverId] = useState("");

  const { mutateAsync: assign, isPending } = useAssignPaymentItem(
    projectId,
    itemId,
  );

  const handleAssign = async () => {
    await assign({
      contractorId: contractorId || null,
      approverId: approverId || null,
    });
    setContractorId("");
    setApproverId("");
  };

  const needsContractor = !item.contractorId;
  const needsApprover = !item.approverId;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-3 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <HardHat className="h-3 w-3" /> Job Status
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as JobStatus[]).map(
            (s) => (
              <button
                key={s}
                disabled
                className={`h-7 rounded text-[11px] font-medium transition border opacity-40 cursor-not-allowed
                ${
                  item.jobStatus === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border"
                }`}
              >
                {s === "NOT_STARTED"
                  ? "Not Started"
                  : s === "IN_PROGRESS"
                    ? "In Progress"
                    : "Completed"}
              </button>
            ),
          )}
        </div>
      </div>

      {(needsContractor || needsApprover) && (
        <div className="rounded-lg border border-border p-3 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <UserCheck className="h-3 w-3" /> Assign
          </div>

          {needsContractor && (
            <div>
              <label className="text-xs font-medium">Contractor</label>
              {contractors.length === 0 ? (
                <div className="mt-1.5 text-xs text-muted-foreground">
                  No contractors on this project yet.
                </div>
              ) : (
                <select
                  value={contractorId}
                  onChange={(e) => setContractorId(e.target.value)}
                  className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  <option value="">Select contractor</option>
                  {contractors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.email}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {needsApprover && (
            <div>
              <label className="text-xs font-medium">Approver</label>
              {approvers.length === 0 ? (
                <div className="mt-1.5 text-xs text-muted-foreground">
                  No approvers on this project yet.
                </div>
              ) : (
                <select
                  value={approverId}
                  onChange={(e) => setApproverId(e.target.value)}
                  className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                >
                  <option value="">Select approver</option>
                  {approvers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.email}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button
            onClick={handleAssign}
            disabled={isPending || (!contractorId && !approverId)}
            className="w-full h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 transition hover:bg-primary/90"
          >
            {isPending ? "Assigning..." : "Assign"}
          </button>
        </div>
      )}

      <div className="rounded-md border border-border bg-surface-elevated p-3 text-xs text-muted-foreground flex items-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5" /> Admins set scope and
        assignments. Approvals are made by the assigned approver.
      </div>
    </div>
  );
}
