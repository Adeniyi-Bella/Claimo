// import { useState, useMemo } from "react";
// import {
//   usePaymentStore,
//   useItem,
//   type ActingRole,
// } from "@/hooks/usePaymentStore";
// import { StatusBadge } from "@/components/common/status-badge";
// import { Avatar } from "@/components/common/avatar";

// import {
//   X,
//   Check,
//   AlertCircle,
//   Send,
//   Clock,
//   Eye,
//   HardHat,
//   ShieldCheck,
//   Users,
//   XCircle,
//   CheckCircle2,
//   MessageSquareWarning,
// } from "lucide-react";
// import { toast } from "sonner";
// import { z } from "zod";
// import { Button } from "@/components/common/button";
// import { derivedStatus, fmtCurrency, itemTotals } from "@/utils";
// import type {
//   Claim,
//   JobStatus,
//   PaymentStatusType,
// } from "@/api/dto/responseDto";

// const claimAmountSchema = (max: number) =>
//   z
//     .number({ error: "Enter an amount" })
//     .positive("Amount must be greater than 0")
//     .max(max, `Cannot exceed remaining ${fmtCurrency(max)}`);

// const claimDescSchema = z
//   .string()
//   .trim()
//   .min(3, "Add a brief description (min 3 chars)")
//   .max(500, "Keep it under 500 characters");

// const rejectReasonSchema = z
//   .string()
//   .trim()
//   .min(5, "Rejection reason is required (min 5 chars)")
//   .max(500, "Keep it under 500 characters");

// export default function PaymentItemPanel({ itemId }: { itemId: string }) {
//   const item = useItem(itemId);
//   const actingRole = usePaymentStore((s) => s.actingRole);
//   const setActingRole = usePaymentStore((s) => s.setActingRole);
//   const submitClaim = usePaymentStore((s) => s.submitClaim);
//   const decideClaim = usePaymentStore((s) => s.decideClaim);
//   const setJobStatus = usePaymentStore((s) => s.setJobStatus);
//   const setPaymentStatus = usePaymentStore((s) => s.setPaymentStatus);
//   const confirmPayment = usePaymentStore((s) => s.confirmPayment);
//   const rejectPayment = usePaymentStore((s) => s.rejectPayment);

//   const totals = useMemo(() => (item ? itemTotals(item) : null), [item]);
//   const status = useMemo(() => (item ? derivedStatus(item) : null), [item]);
//   const pendingClaim = item?.claims.find((c) => c.status === "SUBMITTED");

//   const [claimAmount, setClaimAmount] = useState("");
//   const [claimDesc, setClaimDesc] = useState("");
//   const [claimErr, setClaimErr] = useState<string | null>(null);
//   const [showRejectFor, setShowRejectFor] = useState<string | null>(null);
//   const [rejectReason, setRejectReason] = useState("");
//   const [rejectErr, setRejectErr] = useState<string | null>(null);

//   if (!item || !totals || !status) return null;

//   const canSubmit =
//     actingRole === "CONTRACTOR" &&
//     !pendingClaim &&
//     status !== "COMPLETED" &&
//     totals.remaining > 0;
//   const canDecide = actingRole === "APPROVER" && !!pendingClaim;

//   const fillPct = Math.round(
//     claimAmount && !isNaN(Number(claimAmount))
//       ? (Math.min(Number(claimAmount), totals.remaining) / item.contractValue) *
//           100
//       : 0,
//   );

//   function onSubmitClaim() {
//     setClaimErr(null);
//     const amt = Number(claimAmount);
//     const amountRes = claimAmountSchema(totals!.remaining).safeParse(amt);
//     if (!amountRes.success) {
//       setClaimErr(amountRes.error.issues[0].message);
//       return;
//     }
//     const descRes = claimDescSchema.safeParse(claimDesc);
//     if (!descRes.success) {
//       setClaimErr(descRes.error.issues[0].message);
//       return;
//     }
//     const claim = submitClaim(item!.id, {
//       amount: amountRes.data,
//       description: descRes.data,
//     });
//     setClaimAmount("");
//     setClaimDesc("");
//     toast.success(`Claim #${claim.sequence} submitted`, {
//       description: `${fmtCurrency(claim.amount)} sent to ${item!.approverName} for review.`,
//     });
//   }

//   function onApprove(claimId: string) {
//     decideClaim(item!.id, claimId, "APPROVED");
//     toast.success("Claim approved", {
//       description: `Marked as approved by ${item!.approverName}.`,
//     });
//   }

//   function onReject(claimId: string) {
//     setRejectErr(null);
//     const res = rejectReasonSchema.safeParse(rejectReason);
//     if (!res.success) {
//       setRejectErr(res.error.issues[0].message);
//       return;
//     }
//     decideClaim(item!.id, claimId, "REJECTED", res.data);
//     setShowRejectFor(null);
//     setRejectReason("");
//     toast.error("Claim rejected", {
//       description: "Contractor has been notified to revise and resubmit.",
//     });
//   }

//   return (
//     <div className="flex flex-col h-full">
//       {/* Header */}
//       <div className="flex items-start justify-between p-5 border-b border-border">
//         <div className="min-w-0">
//           <div className="text-xs text-muted-foreground truncate">
//             {item.modelName}
//           </div>
//           <div className="mt-1 text-lg font-semibold tracking-tight">
//             {item.category}
//           </div>
//           <div className="mt-2 flex items-center gap-2">
//             <StatusBadge status={status} />
//             <span className="text-xs text-muted-foreground">
//               · {item.claims.length} claim{item.claims.length !== 1 ? "s" : ""}
//             </span>
//           </div>
//         </div>
//         {/* <Button variant="destructive" onClick={onClose}>
//           <X className="h-4 w-4" />
//         </Button> */}
//       </div>

//       <div className="p-5 space-y-5 overflow-y-auto">
//         {/* Role switcher (demo) */}
//         <div className="rounded-md border border-dashed border-border bg-surface-elevated p-2.5">
//           <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
//             <Eye className="h-3 w-3" /> Viewing as (demo)
//           </div>
//           <div className="grid grid-cols-4 gap-1">
//             {[
//               { k: "CONTRACTOR" as ActingRole, I: HardHat, l: "Contractor" },
//               { k: "APPROVER" as ActingRole, I: ShieldCheck, l: "Approver" },
//               { k: "ADMIN" as ActingRole, I: Users, l: "Admin" },
//               { k: "VIEWER" as ActingRole, I: Eye, l: "Viewer" },
//             ].map((r) => (
//               <button
//                 key={r.k}
//                 onClick={() => setActingRole(r.k)}
//                 className={`h-7 px-2 rounded text-[11px] inline-flex items-center justify-center gap-1 transition
//                   ${actingRole === r.k ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-accent"}`}
//               >
//                 <r.I className="h-3 w-3" />
//                 {r.l}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Totals */}
//         <div className="rounded-lg border border-border bg-surface-elevated p-4">
//           <div className="flex items-baseline justify-between">
//             <div>
//               <div className="text-xs text-muted-foreground">
//                 Approved to date
//               </div>
//               <div className="text-xl font-semibold tabular-nums">
//                 {fmtCurrency(totals.approved)}
//               </div>
//             </div>
//             <div className="text-right">
//               <div className="text-[11px] text-muted-foreground">
//                 of contract
//               </div>
//               <div className="text-sm font-medium tabular-nums">
//                 {fmtCurrency(item.contractValue)}
//               </div>
//             </div>
//           </div>
//           <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden flex">
//             <div
//               className="bg-status-approved-fg h-full"
//               style={{ width: `${totals.approvedPct}%` }}
//             />
//             <div
//               className="bg-status-submitted-fg h-full"
//               style={{ width: `${totals.pendingPct}%` }}
//             />
//           </div>
//           <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
//             <Mini
//               label="Pending"
//               value={fmtCurrency(totals.pending)}
//               dot="bg-status-submitted-fg"
//             />
//             <Mini
//               label="Remaining"
//               value={fmtCurrency(totals.remaining)}
//               dot="bg-muted-foreground/40"
//             />
//             <Mini
//               label="Approved %"
//               value={`${Math.round(totals.approvedPct)}%`}
//               dot="bg-status-approved-fg"
//             />
//           </div>
//         </div>

//         {/* Parties */}
//         <div className="grid grid-cols-2 gap-3">
//           <Party
//             label="Contractor"
//             name={item.contractorName}
//             hue={(item.contractorId.charCodeAt(1) * 70) % 360}
//             icon={HardHat}
//           />
//           <Party
//             label="Approver"
//             name={item.approverName}
//             hue={(item.approverId.charCodeAt(1) * 70) % 360}
//             icon={ShieldCheck}
//           />
//         </div>

//         {/* Completed */}
//         {status === "COMPLETED" && (
//           <div className="rounded-md border border-status-approved-fg/30 bg-status-approved/40 p-3 text-sm text-status-approved-fg flex items-center gap-2">
//             <CheckCircle2 className="h-4 w-4" /> Fully claimed & approved. This
//             item is complete.
//           </div>
//         )}

//         {/* Job Status — contractor only */}
//         {(actingRole === "CONTRACTOR" || actingRole === "ADMIN") && (
//           <div className="rounded-lg border border-border p-3 space-y-2">
//             <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
//               <HardHat className="h-3 w-3" /> Job Status
//             </div>
//             <div className="grid grid-cols-3 gap-1.5">
//               {(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as JobStatus[]).map(
//                 (s) => (
//                   <button
//                     key={s}
//                     disabled={actingRole !== "CONTRACTOR"}
//                     onClick={() => {
//                       const prev = item.jobStatus ?? "NOT_STARTED";
//                       if (prev === s) return;
//                       setJobStatus(item.id, s);
//                       toast.success("Job status updated", {
//                         description: `Status changed to ${s.replace("_", " ").toLowerCase()}.`,
//                       });
//                     }}
//                     className={`h-7 rounded text-[11px] font-medium transition border
//             ${
//               (item.jobStatus ?? "NOT_STARTED") === s
//                 ? "bg-primary text-primary-foreground border-primary"
//                 : "bg-transparent text-muted-foreground border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
//             }`}
//                   >
//                     {s === "NOT_STARTED"
//                       ? "Not Started"
//                       : s === "IN_PROGRESS"
//                         ? "In Progress"
//                         : "Completed"}
//                   </button>
//                 ),
//               )}
//             </div>
//           </div>
//         )}

//         {/* Payment Status — approver only sets PAID or NONE */}
//         {actingRole === "APPROVER" && (
//           <div className="rounded-lg border border-border p-3 space-y-2">
//             <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
//               <ShieldCheck className="h-3 w-3" /> Payment Status
//             </div>
//             <div className="grid grid-cols-2 gap-1.5">
//               {(["NONE", "PAID"] as PaymentStatusType[]).map((s) => (
//                 <button
//                   key={s}
//                   onClick={() => {
//                     const prev = item.paymentStatus ?? "NONE";
//                     if (prev === s) return;
//                     setPaymentStatus(item.id, s);
//                     toast.success("Payment status updated", {
//                       description: `Marked as ${s.toLowerCase()}. Contractor has been notified to confirm.`,
//                     });
//                   }}
//                   className={`h-7 rounded text-[11px] font-medium transition border
//             ${
//               (item.paymentStatus ?? "NONE") === s
//                 ? "bg-primary text-primary-foreground border-primary"
//                 : "bg-transparent text-muted-foreground border-border hover:bg-accent"
//             }`}
//                 >
//                   {s === "NONE" ? "None" : "Paid"}
//                 </button>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Pending payment confirmation — contractor sees this */}
//         {actingRole === "CONTRACTOR" && item.paymentConfirmationPending && (
//           <div className="rounded-lg border border-status-submitted-fg/30 bg-status-submitted/30 p-3 space-y-2.5">
//             <div className="text-xs font-semibold text-status-submitted-fg flex items-center gap-1">
//               <Clock className="h-3.5 w-3.5" />
//               Payment confirmation required
//             </div>
//             <div className="text-sm text-muted-foreground">
//               {item.approverName} has marked this payment as paid. Please
//               confirm or dispute.
//             </div>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => {
//                   confirmPayment(item.id);
//                   toast.success("Payment confirmed", {
//                     description: "You have confirmed receipt of this payment.",
//                   });
//                 }}
//                 className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-md bg-status-approved-fg text-white text-sm font-medium hover:opacity-90 transition"
//               >
//                 <Check className="h-4 w-4" /> Confirm receipt
//               </button>
//               <button
//                 onClick={() => {
//                   rejectPayment(item.id);
//                   toast.error("Payment disputed", {
//                     description:
//                       "Payment marked as not received. The approver has been notified.",
//                   });
//                 }}
//                 className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-md border border-status-rejected-fg/40 text-status-rejected-fg text-sm font-medium hover:bg-status-rejected/40 transition"
//               >
//                 <X className="h-4 w-4" /> Dispute
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Contractor sees current payment status when no confirmation pending */}
//         {actingRole === "CONTRACTOR" && !item.paymentConfirmationPending && (
//           <div className="rounded-lg border border-border p-3 space-y-1">
//             <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
//               <ShieldCheck className="h-3 w-3" /> Payment Status
//             </div>
//             <div className="text-sm font-medium">
//               {(item.paymentStatus ?? "NONE").charAt(0) +
//                 (item.paymentStatus ?? "NONE").slice(1).toLowerCase()}
//             </div>
//           </div>
//         )}

//         {/* Submit claim (contractor) */}
//         {canSubmit && (
//           <div className="rounded-lg border border-border p-3 space-y-2.5">
//             <div className="flex items-center justify-between">
//               <div className="text-xs font-semibold">New claim</div>
//               <button
//                 onClick={() => setClaimAmount(String(totals.remaining))}
//                 className="text-[11px] text-primary hover:underline"
//               >
//                 Claim remaining ({fmtCurrency(totals.remaining)})
//               </button>
//             </div>
//             <div>
//               <label className="text-[11px] text-muted-foreground">
//                 Amount (EUR)
//               </label>
//               <input
//                 type="number"
//                 inputMode="decimal"
//                 min={0}
//                 max={totals.remaining}
//                 value={claimAmount}
//                 onChange={(e) => {
//                   setClaimAmount(e.target.value);
//                   setClaimErr(null);
//                 }}
//                 placeholder="0"
//                 className="mt-1 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-ring/30"
//               />
//               {fillPct > 0 && (
//                 <div className="mt-1.5 text-[11px] text-muted-foreground">
//                   ≈ {fillPct}% of contract
//                 </div>
//               )}
//             </div>
//             <div>
//               <label className="text-[11px] text-muted-foreground">
//                 Description / scope of work
//               </label>
//               <textarea
//                 value={claimDesc}
//                 onChange={(e) => {
//                   setClaimDesc(e.target.value);
//                   setClaimErr(null);
//                 }}
//                 rows={3}
//                 maxLength={500}
//                 placeholder="e.g. Slabs L03–L04 poured, measurement sheet attached"
//                 className="mt-1 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
//               />
//             </div>
//             {claimErr && (
//               <div className="text-xs text-destructive flex items-center gap-1">
//                 <AlertCircle className="h-3 w-3" /> {claimErr}
//               </div>
//             )}
//             <Button
//               onClick={onSubmitClaim}
//               className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition shadow-soft"
//             >
//               <Send className="h-4 w-4" /> Submit claim to{" "}
//               {item.approverName.split(" ")[0]}
//             </Button>
//           </div>
//         )}

//         {/* Pending notice (contractor) */}
//         {actingRole === "CONTRACTOR" && pendingClaim && (
//           <div className="rounded-md border border-status-submitted-fg/30 bg-status-submitted/40 p-3 text-sm text-status-submitted-fg flex items-start gap-2">
//             <Clock className="h-4 w-4 mt-0.5 shrink-0" />
//             <div>
//               Claim #{pendingClaim.sequence} ({fmtCurrency(pendingClaim.amount)}
//               ) is awaiting approval from {item.approverName}. You can submit
//               another once a decision is made.
//             </div>
//           </div>
//         )}

//         {/* Approve/reject (approver) */}
//         {canDecide && pendingClaim && (
//           <div className="rounded-lg border border-status-submitted-fg/30 bg-status-submitted/30 p-3 space-y-2.5">
//             <div className="text-xs font-semibold text-status-submitted-fg">
//               Awaiting your decision — Claim #{pendingClaim.sequence}
//             </div>
//             <div className="text-sm tabular-nums font-semibold">
//               {fmtCurrency(pendingClaim.amount)}{" "}
//               <span className="text-muted-foreground text-xs font-normal">
//                 · {Math.round((pendingClaim.amount / item.contractValue) * 100)}
//                 % of contract
//               </span>
//             </div>
//             {pendingClaim.description && (
//               <div className="text-xs text-muted-foreground italic">
//                 "{pendingClaim.description}"
//               </div>
//             )}
//             {showRejectFor === pendingClaim.id ? (
//               <div className="space-y-2">
//                 <textarea
//                   value={rejectReason}
//                   onChange={(e) => {
//                     setRejectReason(e.target.value);
//                     setRejectErr(null);
//                   }}
//                   rows={2}
//                   maxLength={500}
//                   placeholder="Reason for rejection (required)"
//                   className="w-full rounded-md border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 resize-none"
//                 />
//                 {rejectErr && (
//                   <div className="text-xs text-destructive flex items-center gap-1">
//                     <AlertCircle className="h-3 w-3" /> {rejectErr}
//                   </div>
//                 )}
//                 <div className="flex gap-2">
//                   <button
//                     onClick={() => {
//                       setShowRejectFor(null);
//                       setRejectReason("");
//                       setRejectErr(null);
//                     }}
//                     className="h-8 px-3 rounded-md border border-border bg-surface text-xs hover:bg-accent transition"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={() => onReject(pendingClaim.id)}
//                     className="flex-1 h-8 inline-flex items-center justify-center gap-1.5 rounded-md bg-status-rejected-fg text-white text-xs font-medium hover:opacity-90 transition"
//                   >
//                     <XCircle className="h-3.5 w-3.5" /> Confirm rejection
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               <div className="flex gap-2">
//                 <button
//                   // variant="outline"
//                   onClick={() => onApprove(pendingClaim.id)}
//                   className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-md bg-status-approved-fg text-sm font-medium hover:opacity-90 transition"
//                 >
//                   <Check className="h-4 w-4" /> Approve
//                 </button>
//                 <button
//                   // variant="secondary"
//                   onClick={() => setShowRejectFor(pendingClaim.id)}
//                   className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-md border border-status-rejected-fg/40 text-status-rejected-fg text-sm font-medium hover:bg-status-rejected/40 transition"
//                 >
//                   <X className="h-4 w-4" /> Reject
//                 </button>
//               </div>
//             )}
//           </div>
//         )}

//         {actingRole === "APPROVER" &&
//           !pendingClaim &&
//           status !== "COMPLETED" && (
//             <div className="rounded-md border border-border bg-surface-elevated p-3 text-xs text-muted-foreground flex items-center gap-2">
//               <MessageSquareWarning className="h-3.5 w-3.5" /> No claim is
//               awaiting your review right now.
//             </div>
//           )}

//         {actingRole === "ADMIN" && (
//           <div className="rounded-md border border-border bg-surface-elevated p-3 text-xs text-muted-foreground flex items-center gap-2">
//             <ShieldCheck className="h-3.5 w-3.5" /> Admins set scope and
//             assignments. Approvals are made by the assigned approver.
//           </div>
//         )}

//         {actingRole === "VIEWER" && (
//           <div className="rounded-md border border-border bg-surface-elevated p-3 text-xs text-muted-foreground flex items-center gap-2">
//             <Eye className="h-3.5 w-3.5" /> Read-only access.
//           </div>
//         )}

//         {/* Claim history */}
//         <div>
//           <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
//             Claim history
//           </div>
//           {item.claims.length === 0 ? (
//             <div className="text-xs text-muted-foreground rounded-md border border-dashed border-border p-4 text-center">
//               No claims submitted yet.
//             </div>
//           ) : (
//             <ol className="space-y-3">
//               {item.claims
//                 .slice()
//                 .reverse()
//                 .map((c, idx, arr) => (
//                   <li key={c.id} className="relative pl-6">
//                     <span
//                       className={`absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-surface
//                     ${
//                       c.status === "APPROVED"
//                         ? "bg-status-approved-fg"
//                         : c.status === "REJECTED"
//                           ? "bg-status-rejected-fg"
//                           : "bg-status-submitted-fg"
//                     }`}
//                     />
//                     {idx !== arr.length - 1 && (
//                       <span className="absolute left-[5px] top-5 -bottom-3 w-px bg-border" />
//                     )}
//                     <ClaimRow claim={c} />
//                   </li>
//                 ))}
//             </ol>
//           )}
//         </div>

//         {/* Audit Trail */}
//         <div>
//           <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
//             Audit Trail
//           </div>
//           {(item.auditTrail ?? []).length === 0 ? (
//             <div className="text-xs text-muted-foreground rounded-md border border-dashed border-border p-4 text-center">
//               No activity yet.
//             </div>
//           ) : (
//             <ol className="space-y-2">
//               {(item.auditTrail ?? [])
//                 .slice()
//                 .reverse()
//                 .map((entry) => (
//                   <li key={entry.id} className="flex gap-2.5 text-[11px]">
//                     <span className="mt-1 h-2 w-2 rounded-full shrink-0 bg-muted-foreground/40" />
//                     <div>
//                       <span className="font-medium text-foreground">
//                         {entry.actorName}
//                       </span>
//                       <span className="text-muted-foreground">
//                         {" "}
//                         · {entry.action}
//                       </span>
//                       <div className="text-[10px] text-muted-foreground mt-0.5">
//                         {new Date(entry.timestamp).toLocaleString()}
//                       </div>
//                     </div>
//                   </li>
//                 ))}
//             </ol>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Sub-components ───────────────────────────────────────────────────────────

// function Mini({
//   label,
//   value,
//   dot,
// }: {
//   label: string;
//   value: string;
//   dot: string;
// }) {
//   return (
//     <div>
//       <div className="inline-flex items-center gap-1 text-muted-foreground">
//         <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
//         {label}
//       </div>
//       <div className="mt-0.5 text-xs font-semibold tabular-nums">{value}</div>
//     </div>
//   );
// }

// function Party({
//   label,
//   name,
//   hue,
//   icon: Icon,
// }: {
//   label: string;
//   name: string;
//   hue: number;
//   icon: typeof HardHat;
// }) {
//   return (
//     <div className="rounded-md border border-border bg-surface-elevated p-2.5">
//       <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold inline-flex items-center gap-1">
//         <Icon className="h-3 w-3" />
//         {label}
//       </div>
//       <div className="mt-1.5 flex items-center gap-2">
//         <Avatar name={name} hue={hue} size={26} />
//         <div className="text-xs font-medium truncate">{name}</div>
//       </div>
//     </div>
//   );
// }

// function ClaimRow({ claim }: { claim: Claim }) {
//   return (
//     <div className="rounded-md border border-border bg-surface p-3">
//       <div className="flex items-center justify-between gap-2">
//         <div className="text-sm font-medium">
//           Claim #{claim.sequence}{" "}
//           <span className="text-muted-foreground font-normal">
//             · {fmtCurrency(claim.amount)}
//           </span>
//         </div>
//         <StatusBadge status={claim.status} />
//       </div>
//       {claim.description && (
//         <div className="mt-1.5 text-xs text-muted-foreground">
//           {claim.description}
//         </div>
//       )}
//       <div className="mt-2 text-[11px] text-muted-foreground">
//         Submitted by{" "}
//         <span className="font-medium text-foreground">{claim.submittedBy}</span>{" "}
//         · {new Date(claim.submittedAt).toLocaleString()}
//       </div>
//       {claim.decidedAt && (
//         <div className="mt-1 text-[11px] text-muted-foreground">
//           {claim.status === "APPROVED" ? "Approved" : "Rejected"} by{" "}
//           <span className="font-medium text-foreground">{claim.decidedBy}</span>{" "}
//           · {new Date(claim.decidedAt).toLocaleString()}
//         </div>
//       )}
//       {claim.decisionNote && (
//         <div className="mt-2 text-xs italic bg-muted/50 rounded px-2 py-1.5">
//           "{claim.decisionNote}"
//         </div>
//       )}
//     </div>
//   );
// }
