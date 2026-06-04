import { useState } from "react";
import {
  AlertCircle,
  Check,
  MessageSquareWarning,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { fallbackLabel, fmtCurrency } from "@/utils";
import type { PaymentItem, PaymentStatusType } from "@/api/dto/responseDto";
import {
  useDecideClaim,
  useUpdatePaymentStatus,
} from "@/hooks/api/paymentItem/usePaymentItem";

const rejectReasonSchema = z
  .string()
  .trim()
  .min(5, "Rejection reason is required (min 5 chars)")
  .max(500, "Keep it under 500 characters");

export function ApproverView({
  item,
  projectId,
  itemId,
}: {
  item: PaymentItem;
  projectId: string;
  itemId: string;
}) {
  const { mutate: decideClaim, isPending: isDeciding } = useDecideClaim(
    projectId,
    itemId,
  );
  const { mutate: updatePaymentStatus, isPending: isUpdatingPayment } =
    useUpdatePaymentStatus(projectId, itemId);

  const [showRejectFor, setShowRejectFor] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectErr, setRejectErr] = useState<string | null>(null);

  const pendingClaim = item.claims.find((c) => c.status === "SUBMITTED");

  function onApprove(claimId: string) {
    decideClaim(
      { claimId, data: { decision: "APPROVED" } },
      {
        onSuccess: () => {
          toast.success("Claim approved", {
            description: `Marked as approved by ${fallbackLabel(item.approverName)}.`,
          });
        },
        onError: (error) => {
          toast.error("Failed to approve claim", {
            description: error.message,
          });
        },
      },
    );
  }

  function onReject(claimId: string) {
    setRejectErr(null);
    const res = rejectReasonSchema.safeParse(rejectReason);
    if (!res.success) {
      setRejectErr(res.error.issues[0].message);
      return;
    }

    decideClaim(
      { claimId, data: { decision: "REJECTED", note: res.data } },
      {
        onSuccess: () => {
          setShowRejectFor(null);
          setRejectReason("");
          toast.error("Claim rejected", {
            description: "Contractor has been notified to revise and resubmit.",
          });
        },
        onError: (error) => {
          toast.error("Failed to reject claim", { description: error.message });
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      {/* Payment Status */}
      <div className="rounded-lg border border-border p-3 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> Payment Status
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {(["NONE", "PAID"] as PaymentStatusType[]).map((s) => (
            <button
              key={s}
              disabled={isUpdatingPayment || item.paymentStatus === s}
              onClick={() => {
                updatePaymentStatus(
                  { status: s },
                  {
                    onSuccess: () => {
                      toast.success("Payment status updated", {
                        description: `Marked as ${s.toLowerCase()}. Contractor has been notified to confirm.`,
                      });
                    },
                    onError: (error) => {
                      toast.error("Failed to update payment status", {
                        description: error.message,
                      });
                    },
                  },
                );
              }}
              className={`h-7 rounded text-[11px] font-medium transition border
                ${
                  item.paymentStatus === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                }`}
            >
              {s === "NONE" ? "None" : "Paid"}
            </button>
          ))}
        </div>
      </div>

      {/* Approve / reject pending claim */}
      {pendingClaim ? (
        <div className="rounded-lg border border-status-submitted-fg/30 bg-status-submitted/30 p-3 space-y-2.5">
          <div className="text-xs font-semibold text-status-submitted-fg">
            Awaiting your decision — Claim #{pendingClaim.sequence}
          </div>
          <div className="text-sm tabular-nums font-semibold">
            {fmtCurrency(pendingClaim.amount)}{" "}
            <span className="text-muted-foreground text-xs font-normal">
              · {Math.round((pendingClaim.amount / item.contractValue) * 100)}%
              of contract
            </span>
          </div>
          {pendingClaim.description && (
            <div className="text-xs text-muted-foreground italic">
              "{pendingClaim.description}"
            </div>
          )}
          {showRejectFor === pendingClaim.id ? (
            <div className="space-y-2">
              <textarea
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  setRejectErr(null);
                }}
                rows={2}
                maxLength={500}
                placeholder="Reason for rejection (required)"
                className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
              />
              {rejectErr && (
                <div className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {rejectErr}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRejectFor(null);
                    setRejectReason("");
                    setRejectErr(null);
                  }}
                  className="h-8 px-3 rounded-md border border-border bg-surface text-xs hover:bg-accent transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onReject(pendingClaim.id)}
                  className="flex-1 h-8 inline-flex items-center justify-center gap-1.5 rounded-md bg-status-rejected-fg text-white text-xs font-medium hover:opacity-90 transition"
                >
                  <XCircle className="h-3.5 w-3.5" /> Confirm rejection
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                disabled={isDeciding}
                onClick={() => onApprove(pendingClaim.id)}
                className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-md bg-status-approved-fg text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4" />{" "}
                {isDeciding ? "Approving..." : "Approve"}
              </button>
              <button
                disabled={isDeciding}
                onClick={() => setShowRejectFor(pendingClaim.id)}
                className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-md border border-status-rejected-fg/40 text-status-rejected-fg text-sm font-medium hover:bg-status-rejected/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="h-4 w-4" /> Reject
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-border bg-surface-elevated p-3 text-xs text-muted-foreground flex items-center gap-2">
          <MessageSquareWarning className="h-3.5 w-3.5" /> No claim is awaiting
          your review right now.
        </div>
      )}
    </div>
  );
}
