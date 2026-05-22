import { create } from "zustand";
import {
  fmtCurrency,
  type AuditEntry,
  type Claim,
  type JobStatus,
  type PaymentItem,
  type PaymentStatusType,
  type Project,
} from "@/lib/mock-data";

export type ActingRole = "CONTRACTOR" | "APPROVER" | "ADMIN" | "VIEWER";

const SESSION_KEY = "claimo:projects";

function loadProjects(): Project[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(projects));
}

function updateItem(
  projects: Project[],
  itemId: string,
  updater: (item: PaymentItem) => PaymentItem,
): Project[] {
  return projects.map((p) => ({
    ...p,
    models: p.models.map((m) => ({
      ...m,
      paymentItems: m.paymentItems.map((it) =>
        it.id === itemId ? updater(it) : it,
      ),
    })),
  }));
}

function findItem(
  projects: Project[],
  itemId: string,
): PaymentItem | undefined {
  for (const p of projects) {
    for (const m of p.models) {
      const it = m.paymentItems.find((i) => i.id === itemId);
      if (it) return it;
    }
  }
  return undefined;
}

function makeAuditEntry(
  actorId: string,
  actorName: string,
  actorRole: ActingRole,
  action: string,
  field: AuditEntry["field"],
  fromValue?: string,
  toValue?: string,
): AuditEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: new Date().toISOString(),
    actorId,
    actorName,
    actorRole,
    action,
    field,
    fromValue,
    toValue,
  };
}

interface PaymentState {
  projects: Project[];
  actingRole: ActingRole;
  setActingRole: (r: ActingRole) => void;
  syncFromSession: () => void;
  getItem: (itemId: string) => PaymentItem | undefined;
  submitClaim: (
    itemId: string,
    input: { amount: number; description: string },
  ) => Claim;
  decideClaim: (
    itemId: string,
    claimId: string,
    decision: "APPROVED" | "REJECTED",
    note?: string,
  ) => void;
  setJobStatus: (itemId: string, status: JobStatus) => void;
  setPaymentStatus: (
    itemId: string,
    status: PaymentStatusType,
    onPaid?: () => void,
  ) => void;
  confirmPayment: (itemId: string) => void;
  rejectPayment: (itemId: string) => void;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  projects: loadProjects(),
  actingRole: "CONTRACTOR",
  setActingRole: (r) => set({ actingRole: r }),

  // Call this after session storage is written externally (e.g. after adding a member/model)
  syncFromSession: () => set({ projects: loadProjects() }),

  getItem: (itemId) => findItem(get().projects, itemId),

  submitClaim: (itemId, input) => {
    const now = new Date().toISOString();
    let created!: Claim;
    set((state) => {
      const next = updateItem(state.projects, itemId, (item) => {
        const seq = item.claims.length + 1;
        created = {
          id: `${item.id}-c-${seq}-${Date.now()}`,
          sequence: seq,
          amount: input.amount,
          description: input.description,
          status: "SUBMITTED",
          submittedBy: item.contractorName,
          submittedById: item.contractorId,
          submittedAt: now,
        };
        const entry = makeAuditEntry(
          item.contractorId,
          item.contractorName,
          "CONTRACTOR",
          `Submitted claim #${seq} for ${fmtCurrency(input.amount)}`,
          "CLAIM",
          undefined,
          "SUBMITTED",
        );
        return {
          ...item,
          claims: [...item.claims, created],
          updatedAt: now,
          auditTrail: [...(item.auditTrail ?? []), entry],
        };
      });
      saveProjects(next);
      return { projects: next };
    });
    return created;
  },

  decideClaim: (itemId, claimId, decision, note) => {
    const now = new Date().toISOString();
    set((state) => {
      const item = findItem(state.projects, itemId);
      if (!item) return {};
      const claim = item.claims.find((c) => c.id === claimId);
      if (!claim) return {};
      const entry = makeAuditEntry(
        item.approverId,
        item.approverName,
        "APPROVER",
        `${decision === "APPROVED" ? "Approved" : "Rejected"} claim #${claim.sequence} for ${fmtCurrency(claim.amount)}${note ? ` — "${note}"` : ""}`,
        "CLAIM",
        "SUBMITTED",
        decision,
      );
      const next = updateItem(state.projects, itemId, (i) => ({
        ...i,
        updatedAt: now,
        auditTrail: [...(i.auditTrail ?? []), entry],
        claims: i.claims.map((c) =>
          c.id === claimId
            ? {
                ...c,
                status: decision,
                decidedBy: item.approverName,
                decidedById: item.approverId,
                decidedAt: now,
                decisionNote: note,
              }
            : c,
        ),
      }));
      saveProjects(next);
      return { projects: next };
    });
  },

  setJobStatus: (itemId, status) => {
    const now = new Date().toISOString();
    set((state) => {
      const item = findItem(state.projects, itemId);
      if (!item) return {};
      const entry = makeAuditEntry(
        item.contractorId,
        item.contractorName,
        "CONTRACTOR",
        `Set job status to ${status}`,
        "JOB_STATUS",
        item.jobStatus,
        status,
      );
      const next = updateItem(state.projects, itemId, (i) => ({
        ...i,
        jobStatus: status,
        updatedAt: now,
        auditTrail: [...(i.auditTrail ?? []), entry],
      }));
      saveProjects(next);
      return { projects: next };
    });
  },

  setPaymentStatus: (itemId, status) => {
    const now = new Date().toISOString();
    set((state) => {
      const item = findItem(state.projects, itemId);
      if (!item) return {};
      const entry = makeAuditEntry(
        item.approverId,
        item.approverName,
        "APPROVER",
        `Set payment status to ${status}`,
        "PAYMENT_STATUS",
        item.paymentStatus ?? "NONE",
        status,
      );
      const next = updateItem(state.projects, itemId, (i) => ({
        ...i,
        paymentStatus: status,
        // When approver sets PAID, flag pending confirmation for contractor
        paymentConfirmationPending: status === "PAID",
        updatedAt: now,
        auditTrail: [...(i.auditTrail ?? []), entry],
      }));
      saveProjects(next);
      return { projects: next };
    });
  },

  confirmPayment: (itemId) => {
    const now = new Date().toISOString();
    set((state) => {
      const item = findItem(state.projects, itemId);
      if (!item) return {};
      const entry = makeAuditEntry(
        item.contractorId,
        item.contractorName,
        "CONTRACTOR",
        "Confirmed receipt of payment",
        "SYSTEM",
        "PAID",
        "APPROVED",
      );
      const next = updateItem(state.projects, itemId, (i) => ({
        ...i,
        paymentStatus: "APPROVED",
        paymentConfirmationPending: false,
        updatedAt: now,
        auditTrail: [...(i.auditTrail ?? []), entry],
      }));
      saveProjects(next);
      return { projects: next };
    });
  },

  rejectPayment: (itemId) => {
    const now = new Date().toISOString();
    set((state) => {
      const item = findItem(state.projects, itemId);
      if (!item) return {};
      const entry = makeAuditEntry(
        item.contractorId,
        item.contractorName,
        "CONTRACTOR",
        "Disputed payment — reported as not received",
        "SYSTEM",
        "PAID",
        "REJECTED",
      );
      const next = updateItem(state.projects, itemId, (i) => ({
        ...i,
        paymentStatus: "REJECTED",
        paymentConfirmationPending: false,
        updatedAt: now,
        auditTrail: [...(i.auditTrail ?? []), entry],
      }));
      saveProjects(next);
      return { projects: next };
    });
  },
}));

export function useItem(itemId: string) {
  return usePaymentStore((s) => s.getItem(itemId));
}

export function useProjects() {
  return usePaymentStore((s) => s.projects);
}
