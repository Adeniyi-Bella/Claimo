// ─── Types ───────────────────────────────────────────────────────────────────

import type { DashboardProject } from "@/api/types";

export type ClaimDecision = "SUBMITTED" | "APPROVED" | "REJECTED";
export type PaymentStatus =
  | "NOT_STARTED"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "IN_PROGRESS"
  | "COMPLETED";
export type ProjectRole = "ADMIN" | "CONTRACTOR" | "VIEWER" | "APPROVER";
export type ProjectStatus = "Active" | "Completed" | "Archived";
export type ModelFileType = "ifc";

export type JobStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type PaymentStatusType = "NONE" | "PAID" | "REJECTED" | "APPROVED";

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: ProjectRole;
  action: string;
  field: "JOB_STATUS" | "PAYMENT_STATUS" | "CLAIM" | "SYSTEM";
  fromValue?: string;
  toValue?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: ProjectRole;
  joined: string;
  avatarHue: number;
}

export interface Claim {
  id: string;
  sequence: number;
  amount: number;
  description: string;
  status: ClaimDecision;
  submittedBy: string;
  submittedById: string;
  submittedAt: string;
  decidedBy?: string;
  decidedById?: string;
  decidedAt?: string;
  decisionNote?: string;
  paidAt?: string;
}

export interface PaymentItem {
  id: string;
  category: string;
  modelId: string;
  modelName: string;
  contractorId: string;
  contractorName: string;
  approverId: string;
  approverName: string;
  contractValue: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  claims: Claim[];
  attachedElementIds: string[];
  jobStatus: JobStatus;
  paymentStatus: PaymentStatusType;
  paymentConfirmationPending: boolean;
  auditTrail: AuditEntry[];
}

export interface ProjectModel {
  id: string;
  name: string;
  fileType: ModelFileType;
  fileUrl?: string; 
  uploadedAt: string;
  uploadedBy: string;
  paymentItems: PaymentItem[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  status: ProjectStatus;
  members: Member[];
  models: ProjectModel[];
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

export const CATEGORIES = [
  "Foundations",
  "Concrete Works",
  "Reinforcement",
  "Brickwork",
  "Carpentry",
  "Roofing",
  "Plumbing",
  "Electrical",
  "HVAC",
  "Plastering",
  "Tiling",
  "Painting",
  "Glazing",
  "Landscaping",
  "Demolition",
  "Excavation",
  "Drainage",
  "Fire Protection",
  "Insulation",
];

export const COMPANY = {
  name: "Northpeak Build Group",
};

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

export function derivedStatus(item: PaymentItem): PaymentStatus {
  const t = itemTotals(item);
  if (t.approved >= item.contractValue) return "COMPLETED";
  if (item.claims.some((c) => c.status === "SUBMITTED")) return "SUBMITTED";
  if (t.approved > 0) return "IN_PROGRESS";
  const last = item.claims[item.claims.length - 1];
  if (last && last.status === "REJECTED") return "REJECTED";
  return "NOT_STARTED";
}

export function projectSummary(p: DashboardProject) {
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

