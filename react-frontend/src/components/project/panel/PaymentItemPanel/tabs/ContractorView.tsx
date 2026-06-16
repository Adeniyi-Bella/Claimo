import { useState } from "react";
import { AlertCircle, Check, Clock, HardHat, Send, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/common/button";
import { fallbackLabel, fmtCurrency } from "@/utils";
import type { PaymentItem, JobStatus } from "@/api/dto/responseDto";
import type { ItemTotals } from "@/utils";
import type { PaymentStatus } from "@/types";
import {
  useConfirmPayment,
  useSubmitClaim,
  useUpdateJobStatus,
} from "@/hooks/api/paymentItem/usePaymentItem";

const claimAmountSchema = (max: number) =>
  z
    .number({ error: "Enter an amount" })
    .positive("Amount must be greater than 0")
    .max(max, `Cannot exceed remaining ${fmtCurrency(max)}`);

const claimDescSchema = z
  .string()
  .trim()
  .min(3, "Add a brief description (min 3 chars)")
  .max(500, "Keep it under 500 characters");

export function ContractorView({
  item,
  totals,
  status,
  projectId,
  itemId,
}: {
  item: PaymentItem;
  totals: ItemTotals;
  status: PaymentStatus;
  projectId: string;
  itemId: string;
}) {
  const { mutate: submitClaimMutation, isPending: isSubmitting } =
    useSubmitClaim(projectId, itemId);
  const { mutate: updateJobStatus, isPending: isUpdatingJobStatus } =
    useUpdateJobStatus(projectId, itemId);

  const { mutate: confirmPayment, isPending: isConfirming } = useConfirmPayment(
    projectId,
    itemId,
  );

  const [claimAmount, setClaimAmount] = useState("");
  const [claimDesc, setClaimDesc] = useState("");
  const [claimErr, setClaimErr] = useState<string | null>(null);

  const pendingClaim = item.claims.find((c) => c.status === "SUBMITTED");
  const canSubmit =
    !pendingClaim && status !== "COMPLETED" && totals.remaining > 0;

  const fillPct = Math.round(
    claimAmount && !isNaN(Number(claimAmount))
      ? (Math.min(Number(claimAmount), totals.remaining) / item.contractValue) *
          100
      : 0,
  );

  function onSubmitClaim() {
    setClaimErr(null);
    const amt = Number(claimAmount);
    const amountRes = claimAmountSchema(totals.remaining).safeParse(amt);
    if (!amountRes.success) {
      setClaimErr(amountRes.error.issues[0].message);
      return;
    }
    const descRes = claimDescSchema.safeParse(claimDesc);
    if (!descRes.success) {
      setClaimErr(descRes.error.issues[0].message);
      return;
    }

    submitClaimMutation(
      { amount: amountRes.data, description: descRes.data },
      {
        onSuccess: (updatedItem) => {
          const newClaim = updatedItem.claims[updatedItem.claims.length - 1];
          setClaimAmount("");
          setClaimDesc("");
          toast.success(`Claim #${newClaim.sequence} submitted`, {
            description: `${fmtCurrency(newClaim.amount)} sent to ${fallbackLabel(item.approverName)} for review.`,
          });
        },
        onError: (error) => {
          setClaimErr(
            error.message ?? "Failed to submit claim. Please try again.",
          );
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      {/* Job Status */}
      <div className="rounded-lg border border-border p-3 space-y-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <HardHat className="h-3 w-3" /> Job Status
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as JobStatus[]).map(
            (s) => (
              <button
                key={s}
                disabled={isUpdatingJobStatus}
                onClick={() => {
                  if (item.jobStatus === s) return;
                  updateJobStatus(
                    { status: s },
                    {
                      onSuccess: () => {
                        toast.success("Job status updated", {
                          description: `Status changed to ${s.replace("_", " ").toLowerCase()}.`,
                        });
                      },
                      onError: (error) => {
                        toast.error("Failed to update job status", {
                          description: error.message,
                        });
                      },
                    },
                  );
                }}
                className={`h-7 rounded text-[11px] font-medium transition border
                ${
                  item.jobStatus === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:bg-accent"
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

      {/* Payment confirmation pending */}
      {item.paymentConfirmationPending && (
        <div className="rounded-lg border border-status-submitted-fg/30 bg-status-submitted/30 p-3 space-y-2.5">
          <div className="text-xs font-semibold text-status-submitted-fg flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> Payment confirmation required
          </div>
          <div className="text-sm text-muted-foreground">
            {fallbackLabel(item.approverName)} has marked this payment as paid.
            Please confirm or dispute.
          </div>
          <div className="flex gap-2">
            <button
              disabled={isConfirming}
              onClick={() =>
                confirmPayment(true, {
                  onSuccess: () =>
                    toast.success("Payment confirmed", {
                      description:
                        "You have confirmed receipt of this payment.",
                    }),
                  onError: (error) =>
                    toast.error("Failed to confirm payment", {
                      description: error.message,
                    }),
                })
              }
              className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-md bg-status-approved-fg text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4" />
              {isConfirming ? "Confirming..." : "Confirm receipt"}
            </button>
            <button
              disabled={isConfirming}
              onClick={() =>
                confirmPayment(false, {
                  onSuccess: () =>
                    toast.error("Payment disputed", {
                      description:
                        "Payment marked as not received. The approver has been notified.",
                    }),
                  onError: (error) =>
                    toast.error("Failed to dispute payment", {
                      description: error.message,
                    }),
                })
              }
              className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-md border border-status-rejected-fg/40 text-status-rejected-fg text-sm font-medium hover:bg-status-rejected/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" /> Dispute
            </button>
          </div>
        </div>
      )}

      {/* Payment status (read-only, no confirmation pending) */}
      {!item.paymentConfirmationPending && (
        <div className="rounded-lg border border-border p-3 space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <HardHat className="h-3 w-3" /> Payment Status
          </div>
          <div className="text-sm font-medium">
            {item.paymentStatus.charAt(0) +
              item.paymentStatus.slice(1).toLowerCase()}
          </div>
        </div>
      )}

      {/* Claim form */}
      {canSubmit && (
        <div className="rounded-lg border border-border p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold">New claim</div>
            <button
              onClick={() => setClaimAmount(String(totals.remaining))}
              className="text-[11px] text-primary hover:underline"
            >
              Claim remaining ({fmtCurrency(totals.remaining)})
            </button>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">
              Amount (EUR)
            </label>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={totals.remaining}
              value={claimAmount}
              onChange={(e) => {
                setClaimAmount(e.target.value);
                setClaimErr(null);
              }}
              placeholder="0"
              className="mt-1 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            {fillPct > 0 && (
              <div className="mt-1.5 text-[11px] text-muted-foreground">
                ≈ {fillPct}% of contract
              </div>
            )}
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground">
              Description / scope of work
            </label>
            <textarea
              value={claimDesc}
              onChange={(e) => {
                setClaimDesc(e.target.value);
                setClaimErr(null);
              }}
              rows={3}
              maxLength={500}
              placeholder="e.g. Slabs L03–L04 poured, measurement sheet attached"
              className="mt-1 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
            />
          </div>
          {claimErr && (
            <div className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {claimErr}
            </div>
          )}
          <Button
            onClick={onSubmitClaim}
            disabled={isSubmitting}
            className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition shadow-soft"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Submit claim"}
          </Button>
        </div>
      )}

      {/* Pending notice */}
      {pendingClaim && (
        <div className="rounded-md border border-status-submitted-fg/30 bg-status-submitted/40 p-3 text-sm text-status-submitted-fg flex items-start gap-2">
          <Clock className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            Claim #{pendingClaim.sequence} ({fmtCurrency(pendingClaim.amount)})
            is awaiting approval. You can submit another once a decision is
            made.
          </div>
        </div>
      )}
    </div>
  );
}
