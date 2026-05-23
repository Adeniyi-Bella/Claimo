import { create } from "zustand";
import type * as OBC from "@thatopen/components";
import type * as OBF from "@thatopen/components-front";
import {
  VIEWER_LEFT_PANEL_DEFAULT_WIDTH,
  VIEWER_PANEL_COLLAPSED_WIDTH,
  VIEWER_RIGHT_PANEL_DEFAULT_WIDTH,
} from "../components/panelResize";
import type { IfcTreeNode, PaymentItemLocal } from "./types";
import { getProjectById, updateProjects } from "@/lib/project-storage";

function loadPaymentItems(projectId: string, modelId: string) {
  const project = getProjectById(projectId);
  const model = project?.models.find((item) => item.id === modelId);
  return model ? model.paymentItems : [];
}

function persistAttachments(
  projectId: string,
  updatedItems: PaymentItemLocal[],
) {
  updateProjects((projects) =>
    projects.map((project) => {
      if (project.id !== projectId) return project;
      return {
        ...project,
        models: project.models.map((model) => ({
          ...model,
          paymentItems: model.paymentItems.map((item) => {
            const updated = updatedItems.find((candidate) => candidate.id === item.id);
            return updated
              ? { ...item, attachedElementIds: updated.attachedElementIds }
              : item;
          }),
        })),
      };
    }),
  );
}

export type { IfcTreeNode, PaymentItemLocal } from "./types";

interface ViewerStore {
  projectId: string;
  modelName: string;
  paymentItems: PaymentItemLocal[];
  ifcTree: IfcTreeNode[];
  ifcTreeLoading: boolean;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  leftPanelWidth: number;
  rightPanelWidth: number;
  selectedIds: Set<string>;
  hoveredId: string | null;
  showEdges: boolean;
  colorByStatus: boolean;
  backgroundDark: boolean;
  _components: OBC.Components | null;
  _highlighter: OBF.Highlighter | null;
  _hider: OBC.Hider | null;
  _activeModelId: string | null;
  init: (projectId: string, modelId: string, modelName: string) => void;
  setOBCRefs: (
    components: OBC.Components,
    highlighter: OBF.Highlighter,
    hider: OBC.Hider,
    modelId: string,
  ) => void;
  setIfcTree: (tree: IfcTreeNode[]) => void;
  setIfcTreeLoading: (v: boolean) => void;
  setLeftPanelCollapsed: (v: boolean) => void;
  toggleLeftPanel: () => void;
  setRightPanelCollapsed: (v: boolean) => void;
  toggleRightPanel: () => void;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  toggleSelect: (id: string, additive: boolean) => void;
  selectMany: (ids: string[]) => void;
  clearSelection: () => void;
  setHovered: (id: string | null) => void;
  setShowEdges: (v: boolean) => void;
  setColorByStatus: (v: boolean) => void;
  setBackgroundDark: (v: boolean) => void;
  toggleBackground: () => void;
  attachSelectionToPayment: (paymentId: string) => void;
  detachSelectionFromPayment: (paymentId: string) => void;
}

export const useViewerStore = create<ViewerStore>((set) => ({
  projectId: "",
  modelName: "",
  paymentItems: [],
  ifcTree: [],
  ifcTreeLoading: false,
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  leftPanelWidth: VIEWER_LEFT_PANEL_DEFAULT_WIDTH,
  rightPanelWidth: VIEWER_RIGHT_PANEL_DEFAULT_WIDTH,
  selectedIds: new Set(),
  hoveredId: null,
  showEdges: false,
  colorByStatus: true,
  backgroundDark: true,
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
      leftPanelCollapsed: false,
      rightPanelCollapsed: false,
      leftPanelWidth: VIEWER_LEFT_PANEL_DEFAULT_WIDTH,
      rightPanelWidth: VIEWER_RIGHT_PANEL_DEFAULT_WIDTH,
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
  setLeftPanelCollapsed: (v) => set({ leftPanelCollapsed: v }),
  toggleLeftPanel: () =>
    set((s) => ({
      leftPanelCollapsed: !s.leftPanelCollapsed,
    })),
  setRightPanelCollapsed: (v) => set({ rightPanelCollapsed: v }),
  toggleRightPanel: () =>
    set((s) => ({
      rightPanelCollapsed: !s.rightPanelCollapsed,
    })),
  setLeftPanelWidth: (width) =>
    set({
      leftPanelWidth: Math.max(VIEWER_PANEL_COLLAPSED_WIDTH, width),
    }),
  setRightPanelWidth: (width) =>
    set({
      rightPanelWidth: Math.max(VIEWER_PANEL_COLLAPSED_WIDTH, width),
    }),
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
  setBackgroundDark: (v) => set({ backgroundDark: v }),
  toggleBackground: () =>
    set((s) => ({
      backgroundDark: !s.backgroundDark,
    })),
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
