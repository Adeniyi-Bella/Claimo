import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/common/dialog";
import type { ProjectModel } from "@/lib/mock-data";
import { Upload, File, X } from "lucide-react";
import * as THREE from "three";

function captureThumb(geometryJson: object): Promise<string> {
  return new Promise((resolve) => {
    const width = 400;
    const height = 300;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4ff);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    try {
      const loader = new THREE.BufferGeometryLoader();
      const geometry = loader.parse(geometryJson);
      geometry.computeVertexNormals();

      const material = new THREE.MeshStandardMaterial({
        color: 0x4f7cff,
        roughness: 0.4,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      // Fit camera to geometry
      geometry.computeBoundingBox();
      const box = geometry.boundingBox!;
      const center = new THREE.Vector3();
      box.getCenter(center);
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      mesh.position.set(-center.x, -center.y, -center.z);
      camera.position.set(maxDim * 1.2, maxDim * 0.8, maxDim * 1.5);
      camera.lookAt(0, 0, 0);
    } catch {
      // fallback — just render an empty scene with a grid
      camera.position.set(3, 3, 5);
      camera.lookAt(0, 0, 0);
      scene.add(new THREE.GridHelper(4, 4, 0xcccccc, 0xcccccc));
    }

    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL("image/jpeg", 0.85);

    // Clean up
    renderer.dispose();
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        (obj.material as THREE.Material).dispose();
      }
    });

    resolve(dataUrl);
  });
}

export default function UploadModelModal({
  open,
  onOpenChange,
  onUpload,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpload: (model: ProjectModel, thumb: string) => void;
}) {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setName("");
    setFile(null);
    setError("");
    setLoading(false);
  };

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".json")) {
      setError("Only .json mesh files are supported right now.");
      return;
    }
    setError("");
    setFile(f);
    if (!name) setName(f.name.replace(".json", ""));
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [name],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a .json file.");
      return;
    }
    if (!name.trim()) {
      setError("Please enter a model name.");
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const geometryJson = JSON.parse(text);

      const thumb = await captureThumb(geometryJson);

      const model: ProjectModel = {
        id: `model-${Date.now()}`,
        name: name.trim(),
        uploadedAt: new Date().toISOString().slice(0, 10),
        uploadedBy: "You",
        paymentItems: [],
        // store geometry so the viewer can use it later
        geometryJson,
      } as ProjectModel & { geometryJson: object };

      onUpload(model, thumb);
      reset();
      onOpenChange(false);
    } catch {
      setError(
        "Failed to parse the file. Make sure it's a valid Three.js BufferGeometry JSON.",
      );
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!loading) {
          reset();
          onOpenChange(v);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Upload BIM model</DialogTitle>
            <DialogDescription>
              Upload a Three.js BufferGeometry JSON file. Export from Blender
              using the Three.js exporter.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-medium">Model name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full h-9 rounded-md border border-input bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                placeholder="e.g. Structural — Levels B2 to L08"
              />
            </div>

            {/* Drop zone */}
            <div
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => inputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition
                ${dragOver ? "border-primary/60 bg-primary/5" : "border-border bg-surface-elevated hover:border-primary/40"}`}
            >
              {file ? (
                <div className="flex items-center gap-2 text-sm">
                  <File className="h-5 w-5 text-primary" />
                  <span className="font-medium">{file.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="h-7 w-7 text-muted-foreground" />
                  <div className="text-sm font-medium">
                    Drop your .json file here
                  </div>
                  <div className="text-xs text-muted-foreground">
                    or click to browse
                  </div>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
            </div>

            {error && (
              <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              className="h-9 px-3 rounded-md border border-border bg-surface text-sm hover:bg-accent transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="h-9 px-3.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Processing…
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" /> Upload model
                </>
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
