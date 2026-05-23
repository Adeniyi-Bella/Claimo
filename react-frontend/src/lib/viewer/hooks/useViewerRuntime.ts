import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type * as OBC from "@thatopen/components";
import * as THREE from "three";
import { useViewerStore } from "../state/store";
import {
  createViewerGeometryMesh,
  createViewerRuntime,
  loadViewerModelIntoRuntime,
} from "../scene";
import type { ViewerModelRecord } from "../model";

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
}

export function useViewerRuntime(
  models: ViewerModelRecord[],
  backgroundColor: string,
): UseViewerRuntimeResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const componentsRef = useRef<OBC.Components | null>(null);
  const runtimeRef = useRef<Awaited<ReturnType<typeof createViewerRuntime>> | null>(
    null,
  );
  const cameraRef = useRef<any>(null);
  const backgroundColorRef = useRef(backgroundColor);
  const [status, setStatus] = useState<ModelViewerStatus>("idle");

  const setIfcTree = useViewerStore((state) => state.setIfcTree);
  const setIfcTreeLoading = useViewerStore((state) => state.setIfcTreeLoading);
  const setOBCRefs = useViewerStore((state) => state.setOBCRefs);
  const setSelectionFromModelMap = useViewerStore(
    (state) => state.setSelectionFromModelMap,
  );
  const lastSelectionRef = useRef<Record<string, Set<number>>>({});

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
        });

        runtime.highlighter.events.select.onClear.add(() => {
          lastSelectionRef.current = {};
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

          if (model.fileType === "json" && model.geometryJson) {
            const mesh = createViewerGeometryMesh(model.geometryJson);
            if (!mesh) {
              setStatus("error");
              return;
            }

            runtime.world.scene.three.add(mesh);
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
      if (componentsRef.current) {
        componentsRef.current.dispose();
        componentsRef.current = null;
      }
      cameraRef.current = null;
    };
  }, [models, setIfcTree, setIfcTreeLoading, setOBCRefs, setSelectionFromModelMap]);

  return {
    status,
    containerRef,
    handleResetCamera,
  };
}

function cloneModelIdMap(modelIdMap: Record<string, Set<number>>) {
  return Object.fromEntries(
    Object.entries(modelIdMap).map(([modelId, ids]) => [
      modelId,
      new Set(ids),
    ]),
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
