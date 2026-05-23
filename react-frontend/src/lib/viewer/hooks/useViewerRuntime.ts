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

export type ModelViewerStatus = "idle" | "loading" | "converting" | "ready" | "error";

export interface UseViewerRuntimeResult {
  status: ModelViewerStatus;
  containerRef: RefObject<HTMLDivElement | null>;
  handleResetCamera: () => Promise<void>;
}

export function useViewerRuntime(
  model: ViewerModelRecord | null,
  backgroundColor: string,
): UseViewerRuntimeResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const componentsRef = useRef<OBC.Components | null>(null);
  const runtimeRef = useRef<Awaited<ReturnType<typeof createViewerRuntime>> | null>(null);
  const cameraRef = useRef<any>(null);
  const backgroundColorRef = useRef(backgroundColor);
  const [status, setStatus] = useState<ModelViewerStatus>("idle");

  const setIfcTree = useViewerStore((state) => state.setIfcTree);
  const setIfcTreeLoading = useViewerStore((state) => state.setIfcTreeLoading);

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
    if (!containerRef.current || !model) return;

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

        useViewerStore
          .getState()
          .setOBCRefs(runtime.components, runtime.highlighter, runtime.hider, model.id);

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

        runtime.highlighter.events.select.onHighlight.add((modelIdMap) => {
          const ids = Object.values(modelIdMap).flatMap((set) =>
            Array.from(set).map(String),
          );
          useViewerStore.getState().selectMany(ids);
        });

        runtime.highlighter.events.select.onClear.add(() => {
          useViewerStore.getState().clearSelection();
        });

        if (model.fileType === "ifc") {
          setStatus("converting");
          setIfcTreeLoading(true);

          try {
            const ok = await loadViewerModelIntoRuntime({
              runtime,
              model,
              onTree: setIfcTree,
            });

            if (cancelled) {
              runtime.components.dispose();
              return;
            }

            if (!ok) {
              setStatus("error");
              return;
            }
            setStatus("ready");
          } finally {
            setIfcTreeLoading(false);
          }
        } else if (model.fileType === "json" && model.geometryJson) {
          const mesh = createViewerGeometryMesh(model.geometryJson);
          if (!mesh) {
            setStatus("error");
            return;
          }

          runtime.world.scene.three.add(mesh);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error("Viewer init error:", err);
        if (!cancelled) setStatus("error");
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
  }, [model, setIfcTree, setIfcTreeLoading]);

  return {
    status,
    containerRef,
    handleResetCamera,
  };
}
