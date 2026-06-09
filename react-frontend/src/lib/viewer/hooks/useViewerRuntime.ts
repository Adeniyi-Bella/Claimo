import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type * as OBC from "@thatopen/components";
import * as THREE from "three";
import { useViewerStore } from "../state/store";
import { createViewerRuntime, loadViewerModelIntoRuntime } from "../scene";
import type { ViewerModelRecord } from "../model";
import type { ViewerRuntime } from "../scene/bootstrap";
import { useAuth } from "@clerk/react";

export type ModelViewerStatus =
  | "idle"
  | "loading"
  | "converting"
  | "ready"
  | "error";

export interface UseViewerRuntimeResult {
  status: ModelViewerStatus;
  containerRef: RefObject<HTMLDivElement | null>;
  handleResetCamera: () => Promise<void>;
  runtime: ViewerRuntime | null;
}

export function useViewerRuntime(
  models: ViewerModelRecord[],
  projectId: string,
  backgroundColor: string,
): UseViewerRuntimeResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const componentsRef = useRef<OBC.Components | null>(null);
  const runtimeRef = useRef<Awaited<
    ReturnType<typeof createViewerRuntime>
  > | null>(null);
  const [runtime, setRuntime] = useState<ViewerRuntime | null>(null);
  const cameraRef = useRef<any>(null);
  const backgroundColorRef = useRef(backgroundColor);
  const [status, setStatus] = useState<ModelViewerStatus>("idle");
  const { getToken } = useAuth();

  const setIfcTree = useViewerStore((state) => state.setIfcTree);
  const setIfcTreeLoading = useViewerStore((state) => state.setIfcTreeLoading);
  const setOBCRefs = useViewerStore((state) => state.setOBCRefs);
  const setSelectedElementInfo = useViewerStore(
    (state) => state.setSelectedElementInfo,
  );
  const setSelectionFromModelMap = useViewerStore(
    (state) => state.setSelectionFromModelMap,
  );
  const lastSelectionRef = useRef<Record<string, Set<number>>>({});
  const selectionRequestIdRef = useRef(0);

  const updateSelectionDetails = useCallback(
    async (
      runtimeInstance: Awaited<ReturnType<typeof createViewerRuntime>>,
      modelIdMap: Record<string, Set<number>>,
      preferredModelId?: string,
    ) => {
      const requestId = ++selectionRequestIdRef.current;
      const activeModelId =
        (preferredModelId && modelIdMap[preferredModelId]
          ? preferredModelId
          : null) ?? Object.keys(modelIdMap)[0];
      const localIds = activeModelId
        ? Array.from(modelIdMap[activeModelId] ?? [])
        : [];

      if (!activeModelId || localIds.length === 0) {
        setSelectedElementInfo(null);
        return;
      }

      const loadedModel = runtimeInstance.fragments.list.get(activeModelId) as
        | {
            getItemsData?: (
              ids: number[],
            ) => Promise<Array<Record<string, unknown>>>;
          }
        | undefined;

      if (!loadedModel?.getItemsData) {
        setSelectedElementInfo(null);
        return;
      }

      try {
        const [data = {}] = await loadedModel.getItemsData([localIds[0]]);

        if (requestId !== selectionRequestIdRef.current) return;

        setSelectedElementInfo({
          modelId: activeModelId,
          localId: localIds[0],
          label: inferElementLabel(data, localIds[0]),
          data,
        });
      } catch (error) {
        console.error("Failed to load selected element properties:", error);
        if (requestId === selectionRequestIdRef.current) {
          setSelectedElementInfo(null);
        }
      }
    },
    [setSelectedElementInfo],
  );

  const handleResetCamera = useCallback(async () => {
    if (!cameraRef.current) return;
    await cameraRef.current.controls.setLookAt(12, 6, 12, 0, 0, 0, true);
  }, []);

  useEffect(() => {
    backgroundColorRef.current = backgroundColor;
    if (!runtimeRef.current) return;
    runtimeRef.current.world.scene.three.background = new THREE.Color(
      backgroundColorRef.current,
    );
  }, [backgroundColor]);

  useEffect(() => {
    if (!containerRef.current || models.length === 0) return;

    let cancelled = false;

    const init = async () => {
      setStatus("loading");

      try {
        const runtime = await createViewerRuntime(containerRef.current!);

        if (cancelled) {
          runtime.components.dispose();
          return;
        }

        runtimeRef.current = runtime;
        setRuntime(runtime);
        componentsRef.current = runtime.components;
        cameraRef.current = runtime.camera;
        runtime.world.scene.three.background = new THREE.Color(
          backgroundColorRef.current,
        );

        setOBCRefs(runtime.components, runtime.highlighter, runtime.hider);

        runtime.fragments.list.onItemSet.add(({ value: loadedModel }) => {
          loadedModel.useCamera(runtime.camera.three);
          runtime.world.scene.three.add(loadedModel.object);
          runtime.fragments.core.update(true);
        });

        runtime.fragments.core.models.materials.list.onItemSet.add(
          ({ value: material }) => {
            if (!("isLodMaterial" in material && material.isLodMaterial)) {
              material.polygonOffset = true;
              material.polygonOffsetUnits = 1;
              material.polygonOffsetFactor = Math.random();
            }
          },
        );

        runtime.highlighter.events.select.onBeforeHighlight.add(
          (modelIdMap) => {
            lastSelectionRef.current = cloneModelIdMap(modelIdMap);
          },
        );

        runtime.highlighter.events.select.onHighlight.add((modelIdMap) => {
          const preferredModelId = getSelectionModelId(
            modelIdMap,
            lastSelectionRef.current,
          );
          setSelectionFromModelMap(modelIdMap, preferredModelId);
          lastSelectionRef.current = cloneModelIdMap(modelIdMap);
          void updateSelectionDetails(
            runtime,
            modelIdMap,
            preferredModelId,
          );
        });

        runtime.highlighter.events.select.onClear.add(() => {
          lastSelectionRef.current = {};
          selectionRequestIdRef.current += 1;
          useViewerStore.getState().clearSelection();
        });

        setStatus("converting");
        setIfcTreeLoading(true);

        for (const model of models) {
          if (cancelled) break;

          if (model.fileType === "ifc") {
            const ok = await loadViewerModelIntoRuntime({
              runtime,
              model,
              projectId,
              getToken,
              onTree: (modelId, tree) => setIfcTree(modelId, tree),
            });

            if (cancelled) {
              runtime.components.dispose();
              return;
            }

            if (!ok) {
              setStatus("error");
              return;
            }
            continue;
          }

          setStatus("error");
          return;
        }

        if (!cancelled) {
    setStatus("ready");
      }
      } catch (err) {
        console.error("Viewer init error:", err);
        if (!cancelled) setStatus("error");
      } finally {
        setIfcTreeLoading(false);
      }
    };

    void init();

    return () => {
      cancelled = true;
      runtimeRef.current = null;
      setRuntime(null);
      if (componentsRef.current) {
        componentsRef.current.dispose();
        componentsRef.current = null;
      }
      cameraRef.current = null;
    };
  }, [
    models,
    setIfcTree,
    setIfcTreeLoading,
    setOBCRefs,
    setSelectedElementInfo,
    setSelectionFromModelMap,
  ]);

  return {
    status,
    containerRef,
    handleResetCamera,
    runtime,
  };
}

function inferElementLabel(data: Record<string, unknown>, localId: number) {
  const candidates = [
    data["Name"],
    data["LongName"],
    data["GlobalId"],
    data["type"],
    data["Type"],
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return `Element ${localId}`;
}

function cloneModelIdMap(modelIdMap: Record<string, Set<number>>) {
  return Object.fromEntries(
    Object.entries(modelIdMap).map(([modelId, ids]) => [modelId, new Set(ids)]),
  );
}

function getSelectionModelId(
  next: Record<string, Set<number>>,
  previous: Record<string, Set<number>>,
): string | undefined {
  const nextEntries = Object.entries(next);
  if (nextEntries.length === 0) return undefined;

  for (const [modelId, ids] of nextEntries) {
    const prev = previous[modelId];
    if (!prev || prev.size !== ids.size) {
      return modelId;
    }
    for (const id of ids) {
      if (!prev.has(id)) return modelId;
    }
  }

  return nextEntries[nextEntries.length - 1]?.[0];
}
