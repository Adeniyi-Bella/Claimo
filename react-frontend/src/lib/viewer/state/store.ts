import { create } from "zustand";
import type * as OBC from "@thatopen/components";
import type * as OBF from "@thatopen/components-front";
import {
  VIEWER_LEFT_PANEL_DEFAULT_WIDTH,
  VIEWER_PANEL_COLLAPSED_WIDTH,
  VIEWER_RIGHT_PANEL_DEFAULT_WIDTH,
} from "../components/panelResize";
import type { ViewerModelRecord } from "../model";
import type { IfcTreeNode, PaymentItemLocal } from "./types";
import { getProjectById, updateProjects } from "@/lib/project-storage";

function normalizePaymentItems(items: PaymentItemLocal[] | undefined) {
  return (items ?? []).map((item) => ({
    ...item,
    attachedElementIds: item.attachedElementIds ?? [],
  }));
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
            const updated = updatedItems.find(
              (candidate) => candidate.id === item.id,
            );
            return updated
              ? { ...item, attachedElementIds: updated.attachedElementIds }
              : item;
          }),
        })),
      };
    }),
  );
}

function collectTreeIds(node: IfcTreeNode): number[] {
  const ids = [node.localId];
  for (const child of node.children) {
    ids.push(...collectTreeIds(child));
  }
  return ids;
}

export type { IfcTreeNode, PaymentItemLocal } from "./types";

interface ViewerStore {
  projectId: string;
  modelName: string;
  models: ViewerModelRecord[];
  paymentItems: PaymentItemLocal[];
  ifcTree: IfcTreeNode[];
  ifcTreesByModelId: Record<string, IfcTreeNode[]>;
  ifcTreeLoading: boolean;
  tilesLoading: boolean;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
  leftPanelWidth: number;
  rightPanelWidth: number;
  selectedByModelId: Record<string, Set<number>>;
  selectedIds: Set<string>;
  selectedElementInfo: {
    modelId: string;
    localId: number;
    label: string;
    data: Record<string, unknown>;
  } | null;
  hoveredId: string | null;
  showEdges: boolean;
  colorByStatus: boolean;
  backgroundDark: boolean;
  hiddenModelIds: Set<string>;
  _components: OBC.Components | null;
  _highlighter: OBF.Highlighter | null;
  _hider: OBC.Hider | null;
  _activeModelId: string | null;
  init: (
    projectId: string,
    models: ViewerModelRecord[],
    activeModelId: string,
  ) => void;
  setOBCRefs: (
    components: OBC.Components,
    highlighter: OBF.Highlighter,
    hider: OBC.Hider,
  ) => void;
  setActiveModelId: (modelId: string) => void;
  setIfcTree: (modelId: string, tree: IfcTreeNode[]) => void;
  setIfcTreeLoading: (v: boolean) => void;
  setTilesLoading: (loading: boolean) => void;
  setModelVisibility: (modelId: string, visible: boolean) => Promise<void>;
  setSelectionFromModelMap: (
    modelIdMap: Record<string, Set<number>>,
    preferredModelId?: string,
  ) => void;
  setSelectedElementInfo: (
    info: {
      modelId: string;
      localId: number;
      label: string;
      data: Record<string, unknown>;
    } | null,
  ) => void;
  setLeftPanelCollapsed: (v: boolean) => void;
  toggleLeftPanel: () => void;
  setRightPanelCollapsed: (v: boolean) => void;
  toggleRightPanel: () => void;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  toggleSelect: (id: string, additive: boolean) => void;
  selectMany: (ids: Array<string | number>) => void;
  clearSelection: () => void;
  setHovered: (id: string | null) => void;
  setShowEdges: (v: boolean) => void;
  setColorByStatus: (v: boolean) => void;
  setBackgroundDark: (v: boolean) => void;
  toggleBackground: () => void;
  attachSelectionToPayment: (paymentId: string) => void;
  detachSelectionFromPayment: (paymentId: string) => void;
}

export const useViewerStore = create<ViewerStore>((set, get) => ({
  projectId: "",
  modelName: "",
  models: [],
  paymentItems: [],
  ifcTree: [],
  ifcTreesByModelId: {},
  ifcTreeLoading: false,
  tilesLoading: false,
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  leftPanelWidth: VIEWER_LEFT_PANEL_DEFAULT_WIDTH,
  rightPanelWidth: VIEWER_RIGHT_PANEL_DEFAULT_WIDTH,
  selectedByModelId: {},
  selectedIds: new Set(),
  selectedElementInfo: null,
  hoveredId: null,
  showEdges: false,
  colorByStatus: true,
  backgroundDark: true,
  hiddenModelIds: new Set(),
  _components: null,
  _highlighter: null,
  _hider: null,
  _activeModelId: null,
  init: (projectId, models, activeModelId) => {
    const activeModel =
      models.find((item) => item.id === activeModelId) ?? models[0] ?? null;
    set({
      projectId,
      models,
      modelName: activeModel?.name ?? "",
      paymentItems: normalizePaymentItems(activeModel?.paymentItems),
      selectedIds: new Set(),
      hoveredId: null,
      ifcTree: [],
      ifcTreesByModelId: {},
      ifcTreeLoading: false,
      tilesLoading: false,
      leftPanelCollapsed: false,
      rightPanelCollapsed: false,
      leftPanelWidth: VIEWER_LEFT_PANEL_DEFAULT_WIDTH,
      rightPanelWidth: VIEWER_RIGHT_PANEL_DEFAULT_WIDTH,
      selectedByModelId: {},
      selectedElementInfo: null,
      hiddenModelIds: new Set(),
      _components: null,
      _highlighter: null,
      _hider: null,
      _activeModelId: activeModel?.id ?? null,
    });
  },
  setOBCRefs: (components, highlighter, hider) =>
    set({
      _components: components,
      _highlighter: highlighter,
      _hider: hider,
    }),
  setActiveModelId: (modelId) =>
    set((state) => {
      const project = getProjectById(state.projectId);
      const refreshedModels = project
        ? state.models.map(
            (model) =>
              project.models.find((candidate) => candidate.id === model.id) ??
              model,
          )
        : state.models;
      const model =
        refreshedModels.find((item) => item.id === modelId) ??
        state.models.find((item) => item.id === modelId) ??
        null;
      const activeSelection =
        state.selectedByModelId[modelId] ?? new Set<number>();
      return {
        _activeModelId: modelId,
        modelName: model?.name ?? state.modelName,
        paymentItems: normalizePaymentItems(model?.paymentItems),
        ifcTree: state.ifcTreesByModelId[modelId] ?? [],
        selectedIds: new Set(Array.from(activeSelection).map(String)),
        selectedElementInfo: null,
        hoveredId: null,
        models: refreshedModels,
      };
    }),
  setIfcTree: (modelId, tree) =>
    set((state) => ({
      ifcTree: state._activeModelId === modelId ? tree : state.ifcTree,
      ifcTreesByModelId: {
        ...state.ifcTreesByModelId,
        [modelId]: tree,
      },
    })),
  setIfcTreeLoading: (v) => set({ ifcTreeLoading: v }),
  setTilesLoading: (loading) => set({ tilesLoading: loading }),
  setSelectionFromModelMap: (modelIdMap, preferredModelId) =>
    set((state) => {
      const entries = Object.entries(modelIdMap);
      if (entries.length === 0) {
        return {
          selectedByModelId: {},
          selectedIds: new Set(),
          selectedElementInfo: null,
        };
      }

      const currentActive = state._activeModelId;
      const activeModelId =
        (preferredModelId && modelIdMap[preferredModelId]
          ? preferredModelId
          : null) ??
        (currentActive && modelIdMap[currentActive] ? currentActive : null) ??
        entries[0][0];

      const model =
        state.models.find((item) => item.id === activeModelId) ?? null;
      const selectedIdsForActive =
        modelIdMap[activeModelId] ?? new Set<number>();

      return {
        selectedByModelId: Object.fromEntries(
          entries.map(([modelId, ids]) => [modelId, new Set(ids)]),
        ),
        selectedIds: new Set(Array.from(selectedIdsForActive).map(String)),
        _activeModelId: activeModelId,
        modelName: model?.name ?? state.modelName,
        paymentItems: normalizePaymentItems(model?.paymentItems),
        ifcTree: state.ifcTreesByModelId[activeModelId] ?? [],
        selectedElementInfo: null,
        hoveredId: null,
      };
    }),
  setModelVisibility: async (modelId, visible) => {
    const state = get();
    const hider = state._hider;
    const tree = state.ifcTreesByModelId[modelId];
    if (!hider || !tree || tree.length === 0) return;
    const ids = new Set(tree.flatMap(collectTreeIds));
    await hider.set(visible, { [modelId]: ids });
    set((current) => {
      const nextHidden = new Set(current.hiddenModelIds);
      if (visible) nextHidden.delete(modelId);
      else nextHidden.add(modelId);
      return { hiddenModelIds: nextHidden };
    });
  },
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
      const activeModelId = s._activeModelId;
      if (!activeModelId) return {};
      const value = Number(id);
      if (Number.isNaN(value)) return {};
      const current = s.selectedByModelId[activeModelId] ?? new Set<number>();
      const next = new Set(additive ? current : []);
      if (current.has(value) && additive) next.delete(value);
      else next.add(value);
      return {
        selectedByModelId: {
          ...s.selectedByModelId,
          [activeModelId]: next,
        },
        selectedIds: new Set(Array.from(next).map(String)),
      };
    }),
  selectMany: (ids) =>
    set((s) => {
      const activeModelId = s._activeModelId;
      if (!activeModelId) return {};
      const next = new Set(
        ids.map((id) => Number(id)).filter((id) => !Number.isNaN(id)),
      );
      return {
        selectedByModelId: {
          ...s.selectedByModelId,
          [activeModelId]: next,
        },
        selectedIds: new Set(Array.from(next).map(String)),
      };
    }),
  clearSelection: () =>
    set({
      selectedByModelId: {},
      selectedIds: new Set(),
      selectedElementInfo: null,
    }),
  setSelectedElementInfo: (info) => set({ selectedElementInfo: info }),
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
      const activeModelId = s._activeModelId;
      return {
        paymentItems: updated,
        models: activeModelId
          ? s.models.map((model) =>
              model.id === activeModelId
                ? { ...model, paymentItems: updated }
                : model,
            )
          : s.models,
      };
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
      const activeModelId = s._activeModelId;
      return {
        paymentItems: updated,
        models: activeModelId
          ? s.models.map((model) =>
              model.id === activeModelId
                ? { ...model, paymentItems: updated }
                : model,
            )
          : s.models,
      };
    }),
}));
