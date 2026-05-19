import { create } from "zustand";
import { type Claim, type PaymentItem, type Project } from "@/lib/mock-data";

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
  return projects.map(p => ({
    ...p,
    models: p.models.map(m => ({
      ...m,
      paymentItems: m.paymentItems.map(it => (it.id === itemId ? updater(it) : it)),
    })),
  }));
}

function findItem(projects: Project[], itemId: string): PaymentItem | undefined {
  for (const p of projects) {
    for (const m of p.models) {
      const it = m.paymentItems.find(i => i.id === itemId);
      if (it) return it;
    }
  }
  return undefined;
}

interface PaymentState {
  projects: Project[];
  actingRole: ActingRole;
  setActingRole: (r: ActingRole) => void;
  syncFromSession: () => void;
  getItem: (itemId: string) => PaymentItem | undefined;
  submitClaim: (itemId: string, input: { amount: number; description: string }) => Claim;
  decideClaim: (itemId: string, claimId: string, decision: "APPROVED" | "REJECTED", note?: string) => void;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  projects: loadProjects(),
  actingRole: "CONTRACTOR",
  setActingRole: r => set({ actingRole: r }),

  // Call this after session storage is written externally (e.g. after adding a member/model)
  syncFromSession: () => set({ projects: loadProjects() }),

  getItem: itemId => findItem(get().projects, itemId),

  submitClaim: (itemId, input) => {
    const now = new Date().toISOString();
    let created!: Claim;
    set(state => {
      const next = updateItem(state.projects, itemId, item => {
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
        return { ...item, claims: [...item.claims, created], updatedAt: now };
      });
      saveProjects(next);
      return { projects: next };
    });
    return created;
  },

  decideClaim: (itemId, claimId, decision, note) => {
    const now = new Date().toISOString();
    set(state => {
      const next = updateItem(state.projects, itemId, item => ({
        ...item,
        updatedAt: now,
        claims: item.claims.map(c =>
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
}));

export function useItem(itemId: string) {
  return usePaymentStore(s => s.getItem(itemId));
}

export function useProjects() {
  return usePaymentStore(s => s.projects);
}