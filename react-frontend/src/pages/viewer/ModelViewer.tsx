import { useParams, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import { Boxes, Loader2 } from "lucide-react";
import { loadModelFile } from "@/lib/model-storage";
import { useViewerStore, type IfcTreeNode } from "@/lib/viewer/store";
import { LeftPanel } from "@/components/viewer/LeftPanel";
import { ViewerToolbar } from "@/components/viewer/ViewerToolbar";
import { RightPanel } from "@/components/viewer/RightPanel";

const SESSION_KEY = "claimo:projects";

function loadProjects(): any[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Route component ──────────────────────────────────────────────────────────

export default function ModelViewer() {
  const { projectId, modelId } = useParams({
    from: "/_authenticated/viewer/$projectId/$modelId",
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const componentsRef = useRef<OBC.Components | null>(null);
  const cameraRef = useRef<OBC.OrthoPerspectiveCamera | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "converting" | "ready" | "error"
  >("idle");

  const initStore = useViewerStore((s) => s.init);

  const projects = loadProjects();
  const project = projects.find((p: any) => p.id === projectId);
  const model = project?.models.find((m: any) => m.id === modelId);

  // Seed viewer store with this model's payment items
  useEffect(() => {
    if (project && model) {
      initStore(projectId, modelId, model.name);
    }
  }, [projectId, modelId]);

  const handleResetCamera = useCallback(async () => {
    if (!cameraRef.current) return;
    await cameraRef.current.controls.setLookAt(12, 6, 12, 0, 0, 0, true);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !model) return;

    let cancelled = false;

    const init = async () => {
      setStatus("loading");

      try {
        // ── 1. Bootstrap Components + World ──────────────────────────────────
        // Mirrors the tutorial exactly: Components → Worlds → SimpleScene +
        // OrthoPerspectiveCamera + SimpleRenderer → components.init()
        const components = new OBC.Components();
        componentsRef.current = components;

        const worlds = components.get(OBC.Worlds);
        const world = worlds.create<
          OBC.SimpleScene,
          OBC.OrthoPerspectiveCamera,
          OBC.SimpleRenderer
        >();

        world.scene = new OBC.SimpleScene(components);
        world.scene.setup();
        // Match app dark background instead of null (looks better in context)
        world.scene.three.background = null;

        world.renderer = new OBC.SimpleRenderer(
          components,
          containerRef.current!,
        );
        // Hide the ThatOpen watermark logo
        world.renderer.showLogo = false;

        world.camera = new OBC.OrthoPerspectiveCamera(components);

        cameraRef.current = world.camera;
        // Start at a wide angle; will be overridden once model loads
        await world.camera.controls.setLookAt(12, 6, 12, 0, 0, 0);

        components.init();

        // Add a grid floor

        if (cancelled) {
          components.dispose();
          return;
        }

        // ── 2. FragmentsManager ───────────────────────────────────────────────
        // Per the tutorial: getWorker() fetches the matching worker version
        // from unpkg and returns a blob URL. Must call before fragments.init().
        const workerUrl = await OBC.FragmentsManager.getWorker();
        const fragments = components.get(OBC.FragmentsManager);
        fragments.init(workerUrl);

        if (cancelled) {
          components.dispose();
          return;
        }

        // Wire camera updates to fragments LOD/culling — from the tutorial
        world.camera.controls.addEventListener("update", () =>
          fragments.core.update(),
        );

        // Once a model is loaded (or converted), add it to the scene
        fragments.list.onItemSet.add(({ value: loadedModel }) => {
          loadedModel.useCamera(world.camera.three);
          world.scene.three.add(loadedModel.object);
          fragments.core.update(true);
          useViewerStore
            .getState()
            .setOBCRefs(components, highlighter, hider, model.id);
          setStatus("ready");
        });

        // Remove z-fighting — copied verbatim from tutorial
        fragments.core.models.materials.list.onItemSet.add(
          ({ value: material }) => {
            if (!("isLodMaterial" in material && material.isLodMaterial)) {
              material.polygonOffset = true;
              material.polygonOffsetUnits = 1;
              material.polygonOffsetFactor = Math.random();
            }
          },
        );

        components.get(OBC.Grids).create(world);

        const highlighter = components.get(OBCF.Highlighter);
        components.get(OBC.Raycasters).get(world);
        highlighter.setup({ world });
        highlighter.zoomToSelection = true;
        highlighter.events.select.onHighlight.add((modelIdMap) => {
          const ids = Object.values(modelIdMap).flatMap((set) =>
            Array.from(set).map(String),
          );
          useViewerStore.getState().selectMany(ids);
        });

        highlighter.events.select.onClear.add(() => {
          useViewerStore.getState().clearSelection();
        });
        const hider = components.get(OBC.Hider);

        // ── 3. Load the model ────────────────────────────────────────────────
        if (model.fileType === "ifc") {
          // ── IFC path ──────────────────────────────────────────────────────
          // Configure IfcLoader with WASM pointed at unpkg (same as tutorial).
          // autoSetWasm: false means we provide the path ourselves; this avoids
          // an extra fetch to unpkg for the package.json version check.
          const ifcLoader = components.get(OBC.IfcLoader);
          await ifcLoader.setup({
            autoSetWasm: false,
            wasm: {
              // The tutorial uses unpkg for the wasm binary.
              // Replace with a local path ("/wasm/") if you copy the wasm file
              // to public/ via vite-plugin-static-copy (preferred for production).
              path: "https://unpkg.com/web-ifc@0.0.77/",
              absolute: true,
            },
          });

          if (cancelled) {
            components.dispose();
            return;
          }

          setStatus("converting");

          const buffer = await loadModelFile(model.id);
          if (!buffer) {
            // File was never saved or was cleared — ask user to re-upload
            setStatus("error");
            return;
          }
          const data = new Uint8Array(buffer);

          // ifcLoader.load() handles:
          //   1. WASM init via web-ifc
          //   2. IFC → Fragments conversion (the slow part, runs in WASM)
          //   3. Hands the result to FragmentsManager
          //   4. fragments.list.onItemSet fires → our handler above adds to scene
          await ifcLoader.load(data, true, model.id, {
            processData: {
              progressCallback: (progress: number) => {
                // Could expose this to UI for a progress bar later
                console.log(`IFC conversion: ${Math.round(progress * 100)}%`);
              },
            },
          });

          // Snap grid to ground floor
          const loadedModel = fragments.list.get(model.id);
          if (loadedModel) {
            const storeys = await loadedModel.getItemsOfCategories([
              /BUILDINGSTOREY/,
            ]);
            const localIds = Object.values(storeys).flat();
            const data = await loadedModel.getItemsData(localIds);

            // Find the ground floor (lowest elevation storey)
            let groundElevation = 0;
            let lowestElevation = Infinity;

            for (const attributes of data) {
              if (
                !("Elevation" in attributes && "value" in attributes.Elevation)
              )
                continue;
              if (attributes.Elevation.value < lowestElevation) {
                lowestElevation = attributes.Elevation.value;
              }
            }

            if (lowestElevation !== Infinity) {
              const [, coordHeight] = await loadedModel.getCoordinates();
              groundElevation = lowestElevation + coordHeight;
            }

            components.get(OBC.Grids).list.forEach((grid) => {
              grid.three.position.y = groundElevation;
            });

            const { setIfcTree, setIfcTreeLoading } = useViewerStore.getState();
            setIfcTreeLoading(true);
            try {
              const loadedModel = fragments.list.get(model.id);
              if (loadedModel) {
                const spatialStructure =
                  await loadedModel.getSpatialStructure();
                console.log(
                  "spatial structure:",
                  JSON.stringify(spatialStructure, null, 2),
                );
                const convertNode = (
                  raw: any,
                  inheritedCategory?: string,
                ): IfcTreeNode | null => {
                  if (raw.localId === null) {
                    return (raw.children ?? []).flatMap(
                      (c: any) => convertNode(c, raw.category) ?? [],
                    );
                  }
                  return {
                    localId: raw.localId,
                    expressId: String(raw.localId),
                    name:
                      inheritedCategory ?? raw.category ?? String(raw.localId),
                    type: inheritedCategory ?? raw.category ?? "",
                    modelId: model.id,
                    children: (raw.children ?? []).flatMap(
                      (c: any) => convertNode(c) ?? [],
                    ),
                  };
                };

                setIfcTree(
                  (spatialStructure.children ?? []).flatMap(
                    (c: any) => convertNode(c) ?? [],
                  ),
                );
              }
            } catch (err) {
              console.error("Failed to build IFC tree:", err);
            } finally {
              setIfcTreeLoading(false);
            }
          }
        } else if (model.fileType === "json" && model.geometryJson) {
          // ── JSON / BufferGeometry path ─────────────────────────────────────
          // ThatOpen doesn't have a native JSON BufferGeometry loader,
          // so we build the Three.js geometry manually and add it directly
          // to the ThatOpen world scene — exactly as before, just targeting
          // world.scene.three instead of an R3F canvas.
          const { data: geoData } = model.geometryJson;
          const THREE = await import("three");
          const geo = new THREE.BufferGeometry();
          const { position, normal } = geoData.attributes;

          geo.setAttribute(
            "position",
            new THREE.BufferAttribute(
              new Float32Array(position.array),
              position.itemSize,
            ),
          );

          if (normal) {
            geo.setAttribute(
              "normal",
              new THREE.BufferAttribute(
                new Float32Array(normal.array),
                normal.itemSize,
              ),
            );
          } else {
            geo.computeVertexNormals();
          }

          if (geoData.index) {
            geo.setIndex(geoData.index.array);
          }

          // Auto-center
          geo.computeBoundingBox();
          const box = geo.boundingBox!;
          const center = new THREE.Vector3();
          box.getCenter(center);
          geo.translate(-center.x, -box.min.y, -center.z);

          const mesh = new THREE.Mesh(
            geo,
            new THREE.MeshStandardMaterial({
              color: "#6b8cba",
              roughness: 0.45,
              metalness: 0.15,
              side: THREE.DoubleSide,
            }),
          );

          world.scene.three.add(mesh);
          setStatus("ready");
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error("Viewer init error:", err);
        if (!cancelled) setStatus("error");
      }
    };

    init();

    // ── Cleanup ───────────────────────────────────────────────────────────────
    // The docs explicitly warn: dispose Components when done to avoid memory
    // leaks, especially in React where the component can unmount.
    return () => {
      cancelled = true;
      if (componentsRef.current) {
        componentsRef.current.dispose();
        componentsRef.current = null;
      }
    };
  }, [model?.id]); // re-init only if the model changes

  if (!project || !model) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <Boxes className="h-12 w-12 opacity-30" />
        <p className="text-sm">Model not found.</p>
        <Link
          to="/projects/$projectId"
          params={{ projectId }}
          className="text-sm text-primary hover:underline"
        >
          ← Back to project
        </Link>
      </div>
    );
  }

  return (
    <div
      className="dark flex flex-col h-screen w-screen overflow-hidden"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <ViewerToolbar
        modelName={model.name}
        projectId={projectId}
        status={status}
        onResetCamera={handleResetCamera}
      />

      <div className="flex flex-1 min-h-0">
        <LeftPanel />

        {/* Canvas area */}
        <main
          className="flex-1 relative min-w-0"
          style={{ background: "var(--viewer-canvas)" }}
        >
          {/* ThatOpen mounts here */}
          <div
            ref={containerRef}
            className="absolute inset-0"
            style={{ background: "var(--viewer-canvas)" }}
          />

          {status !== "ready" && status !== "error" && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20"
              style={{ background: "var(--viewer-canvas)" }}
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-sm font-medium text-foreground">
                {status === "idle" && "Preparing…"}
                {status === "loading" && "Initialising scene…"}
                {status === "converting" &&
                  "Converting IFC, this may take a moment…"}
              </div>
            </div>
          )}

          {/* Legend overlay — bottom left of canvas, same as example */}
          <div
            className="absolute bottom-4 left-4 rounded-md border px-3 py-2 text-[10px] font-medium z-10 backdrop-blur"
            style={{
              background: "oklch(0.17 0.02 255 / 90%)",
              borderColor: "var(--viewer-panel-border)",
            }}
          >
            <div className="uppercase tracking-wider text-muted-foreground mb-1.5">
              Claim status
            </div>
            {[
              { label: "Approved", bg: "var(--status-approved-fg)" },
              { label: "In Progress", bg: "var(--status-submitted-fg)" },
              { label: "Rejected", bg: "var(--status-rejected-fg)" },
              { label: "Unclaimed", bg: "var(--status-neutral)" },
              { label: "Selected", bg: "var(--status-selected)" },
            ].map((i) => (
              <div key={i.label} className="flex items-center gap-2 mb-1">
                <span
                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{ background: i.bg }}
                />
                <span className="text-muted-foreground">{i.label}</span>
              </div>
            ))}
            <div
              className="mt-2 pt-2 border-t text-muted-foreground leading-snug"
              style={{ borderColor: "var(--viewer-panel-border)" }}
            >
              Click · select &nbsp;|&nbsp; Shift · multi
            </div>
          </div>

          {status === "error" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <p className="text-sm text-destructive bg-surface/80 px-4 py-2 rounded-lg border border-border">
                Failed to load model. Check the console for details.
              </p>
            </div>
          )}
        </main>

        <RightPanel />
      </div>
    </div>
  );
}
