import type {
  ProjectModel,
  ProjectResponse,
  PaymentItem,
} from "./api/dto/responseDto";

export function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export interface ItemTotals {
  contract: number;
  approved: number;
  pending: number;
  rejected: number;
  remaining: number;
  approvedPct: number;
  pendingPct: number;
}

export function itemTotals(item: PaymentItem): ItemTotals {
  const approved = item.claims
    .filter((c) => c.status === "APPROVED")
    .reduce((s, c) => s + c.amount, 0);
  const pending = item.claims
    .filter((c) => c.status === "SUBMITTED")
    .reduce((s, c) => s + c.amount, 0);
  const rejected = item.claims
    .filter((c) => c.status === "REJECTED")
    .reduce((s, c) => s + c.amount, 0);
  const remaining = Math.max(0, item.contractValue - approved - pending);
  return {
    contract: item.contractValue,
    approved,
    pending,
    rejected,
    remaining,
    approvedPct: item.contractValue ? (approved / item.contractValue) * 100 : 0,
    pendingPct: item.contractValue ? (pending / item.contractValue) * 100 : 0,
  };
}

export function projectSummary(p: ProjectResponse) {
  const items = p.models.flatMap((m) => m.paymentItems);
  const totals = items.reduce(
    (acc, i) => {
      const t = itemTotals(i);
      acc.total += t.contract;
      acc.approved += t.approved;
      acc.submitted += t.pending;
      acc.rejected += t.rejected;
      return acc;
    },
    { total: 0, approved: 0, submitted: 0, rejected: 0 },
  );
  return {
    ...totals,
    remaining: totals.total - totals.approved,
    itemCount: items.length,
  };
}

export function modelSummary(m: ProjectModel) {
  return m.paymentItems.reduce(
    (acc, i) => {
      const t = itemTotals(i);
      acc.total += t.contract;
      acc.approved += t.approved;
      acc.submitted += t.pending;
      return acc;
    },
    { total: 0, approved: 0, submitted: 0 },
  );
}

export function getSubmittedOrApprovedAmount(item: PaymentItem) {
  const totals = itemTotals(item);
  return totals.pending > 0
    ? totals.pending
    : totals.approved > 0
      ? totals.approved
      : null;
}