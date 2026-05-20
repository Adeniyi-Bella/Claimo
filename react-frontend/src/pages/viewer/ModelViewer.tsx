import { useParams, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as OBC from "@thatopen/components";
import { ArrowLeft, Boxes, Loader2 } from "lucide-react";
import { loadModelFile } from "@/lib/model-storage";

const SESSION_KEY = "claimo:projects";

function loadProjects(): any[] {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function Toolbar({
  modelName,
  projectId,
  status,
}: {
  modelName: string;
  projectId: string;
  status: "idle" | "loading" | "converting" | "ready" | "error";
}) {
  const statusLabel: Record<typeof status, string> = {
    idle: "",
    loading: "Initialising viewer…",
    converting: "Converting IFC to Fragments — this may take a moment…",
    ready: "",
    error: "Failed to load model.",
  };

  return (
    <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-surface/80 backdrop-blur border-b border-border">
      <div className="flex items-center gap-3">
        <Link
          to="/projects/$projectId"
          params={{ projectId }}
          search={{ tab: "Models" } as any}
          className="h-8 px-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface text-sm hover:bg-accent transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to models
        </Link>
        <div className="h-4 w-px bg-border" />
        <div className="inline-flex items-center gap-1.5 text-sm font-medium">
          <Boxes className="h-4 w-4 text-primary" />
          {modelName}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {(status === "loading" || status === "converting") && (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        )}
        {statusLabel[status] && <span>{statusLabel[status]}</span>}
        {status === "ready" && (
          <span className="hidden sm:inline">
            Scroll · zoom &nbsp;|&nbsp; Left drag · orbit &nbsp;|&nbsp; Right
            drag · pan
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Route component ──────────────────────────────────────────────────────────

export default function ModelViewer() {
  const { projectId, modelId } = useParams({
    from: "/_authenticated/viewer/$projectId/$modelId",
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const componentsRef = useRef<OBC.Components | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "converting" | "ready" | "error"
  >("idle");

  const projects = loadProjects();
  const project = projects.find((p: any) => p.id === projectId);
  const model = project?.models.find((m: any) => m.id === modelId);

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
    <div className="relative h-screen w-screen overflow-hidden bg-[oklch(0.12_0.02_250)]">
      <Toolbar modelName={model.name} projectId={projectId} status={status} />

      {/* ThatOpen renders into this div — no <Canvas> */}
      <div
        ref={containerRef}
        className="absolute inset-0 pt-[53px]"
        style={{ background: "oklch(0.12 0.02 250)" }}
      />

      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-destructive bg-surface/80 px-4 py-2 rounded-lg">
            Failed to load model. Check the console for details.
          </p>
        </div>
      )}
    </div>
  );
}
