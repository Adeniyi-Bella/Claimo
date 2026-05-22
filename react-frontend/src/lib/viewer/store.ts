import { create } from "zustand";
import type * as OBC from "@thatopen/components";
import type * as OBF from "@thatopen/components-front";

const SESSION_KEY = "claimo:projects";

function loadPaymentItems(projectId: string, modelId: string) {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return [];
    const projects = JSON.parse(raw);
    const project = projects.find((p: any) => p.id === projectId);
    if (!project) return [];
    const model = project.models.find((m: any) => m.id === modelId);
    return model ? model.paymentItems : [];
  } catch {
    return [];
  }
}

function persistAttachments(
  projectId: string,
  updatedItems: PaymentItemLocal[],
) {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const projects = JSON.parse(raw);
    const next = projects.map((p: any) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        models: p.models.map((m: any) => ({
          ...m,
          paymentItems: m.paymentItems.map((item: any) => {
            const updated = updatedItems.find((u) => u.id === item.id);
            return updated
              ? { ...item, attachedElementIds: updated.attachedElementIds }
              : item;
          }),
        })),
      };
    });
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {
    // noop
  }
}

export interface PaymentItemLocal {
  id: string;
  category: string;
  modelId: string;
  modelName: string;
  contractorName: string;
  contractValue: number;
  description?: string;
  claims: any[];
  attachedElementIds: string[];
}

// ─── IFC Tree ─────────────────────────────────────────────────────────────────

export interface IfcTreeNode {
  localId: number;
  expressId: string; // string version for selectedIds compatibility
  name: string;
  type: string;
  modelId: string;
  children: IfcTreeNode[];
}

interface ViewerStore {
  projectId: string;
  modelName: string;

  paymentItems: PaymentItemLocal[];

  // IFC spatial tree
  ifcTree: IfcTreeNode[];
  ifcTreeLoading: boolean;

  // Element selection (keyed by IFC expressID as string)
  selectedIds: Set<string>;
  hoveredId: string | null;

  // Display toggles
  showEdges: boolean;
  colorByStatus: boolean;

  // OBC/OBF component refs — set by ModelViewer after init
  // Not reactive — just stored so panels can call OBC APIs
  _components: OBC.Components | null;
  _highlighter: OBF.Highlighter | null;
  _hider: OBC.Hider | null;
  _activeModelId: string | null;

  // Actions
  init: (projectId: string, modelId: string, modelName: string) => void;
  setOBCRefs: (
    components: OBC.Components,
    highlighter: OBF.Highlighter,
    hider: OBC.Hider,
    modelId: string,
  ) => void;
  setIfcTree: (tree: IfcTreeNode[]) => void;
  setIfcTreeLoading: (v: boolean) => void;

  toggleSelect: (id: string, additive: boolean) => void;
  selectMany: (ids: string[]) => void;
  clearSelection: () => void;
  setHovered: (id: string | null) => void;
  setShowEdges: (v: boolean) => void;
  setColorByStatus: (v: boolean) => void;
  attachSelectionToPayment: (paymentId: string) => void;
  detachSelectionFromPayment: (paymentId: string) => void;
}

export const useViewerStore = create<ViewerStore>((set, get) => ({
  projectId: "",
  modelName: "",
  paymentItems: [],
  ifcTree: [],
  ifcTreeLoading: false,
  selectedIds: new Set(),
  hoveredId: null,
  showEdges: false,
  colorByStatus: true,

  _components: null,
  _highlighter: null,
  _hider: null,
  _activeModelId: null,

  init: (projectId, modelId, modelName) => {
    const items = loadPaymentItems(projectId, modelId);
    set({
      projectId,
      modelName,
      paymentItems: items.map((i: any) => ({
        ...i,
        attachedElementIds: i.attachedElementIds ?? [],
      })),
      selectedIds: new Set(),
      hoveredId: null,
      ifcTree: [],
      ifcTreeLoading: false,
      _components: null,
      _highlighter: null,
      _hider: null,
      _activeModelId: null,
    });
  },

  setOBCRefs: (components, highlighter, hider, modelId) =>
    set({
      _components: components,
      _highlighter: highlighter,
      _hider: hider,
      _activeModelId: modelId,
    }),

  setIfcTree: (tree) => set({ ifcTree: tree }),
  setIfcTreeLoading: (v) => set({ ifcTreeLoading: v }),

  toggleSelect: (id, additive) =>
    set((s) => {
      const next = new Set(additive ? s.selectedIds : []);
      if (s.selectedIds.has(id) && additive) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  selectMany: (ids) => set({ selectedIds: new Set(ids) }),
  clearSelection: () => set({ selectedIds: new Set() }),
  setHovered: (id) => set({ hoveredId: id }),
  setShowEdges: (v) => set({ showEdges: v }),
  setColorByStatus: (v) => set({ colorByStatus: v }),

  attachSelectionToPayment: (paymentId) =>
    set((s) => {
      const sel = Array.from(s.selectedIds);
      if (sel.length === 0) return {};
      const updated = s.paymentItems.map((p) => {
        if (p.id !== paymentId) {
          const filtered = p.attachedElementIds.filter(
            (id) => !s.selectedIds.has(id),
          );
          return filtered.length === p.attachedElementIds.length
            ? p
            : { ...p, attachedElementIds: filtered };
        }
        const merged = Array.from(new Set([...p.attachedElementIds, ...sel]));
        return { ...p, attachedElementIds: merged };
      });
      persistAttachments(s.projectId, updated);
      return { paymentItems: updated };
    }),

  detachSelectionFromPayment: (paymentId) =>
    set((s) => {
      const updated = s.paymentItems.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              attachedElementIds: p.attachedElementIds.filter(
                (id) => !s.selectedIds.has(id),
              ),
            }
          : p,
      );
      persistAttachments(s.projectId, updated);
      return { paymentItems: updated };
    }),
}));

export function getElementPaymentMap(
  items: PaymentItemLocal[],
): Map<string, PaymentItemLocal> {
  const map = new Map<string, PaymentItemLocal>();
  for (const p of items) {
    for (const id of p.attachedElementIds) map.set(id, p);
  }
  return map;
}

// ─── Helpers used by LeftPanel ────────────────────────────────────────────────

/** Collect all localIds (as numbers) from a node and its descendants. */
export function collectNodeIds(node: IfcTreeNode): number[] {
  const ids: number[] = [node.localId];
  for (const child of node.children) {
    ids.push(...collectNodeIds(child));
  }
  return ids;
}
