import { useState, useRef } from "react";
import type { ProjectModel, ModelFileType } from "@/lib/mock-data";
import { Upload, X, FileBox } from "lucide-react";
import { saveModelFile } from "@/lib/model-storage";

interface UploadModelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (model: ProjectModel, thumb: string) => void;
}

export default function UploadModelModal({
  open,
  onOpenChange,
  onUpload,
}: UploadModelModalProps) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const accept = [".ifc", ".json"];

  const handleFile = (f: File) => {
    setError(null);
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext !== "ifc" && ext !== "json") {
      setError("Only .ifc and .json files are supported.");
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() as ModelFileType;
      const id = crypto.randomUUID();

      let geometryJson = undefined;
      let fileUrl = undefined;

      if (ext === "json") {
        // Parse JSON geometry — existing logic
        const text = await file.text();
        geometryJson = JSON.parse(text);
      } else {
        const buffer = await file.arrayBuffer();
        await saveModelFile(id, buffer);
      }

      const model: ProjectModel = {
        id,
        name: file.name,
        fileType: ext,
        fileUrl,
        geometryJson,
        uploadedAt: new Date().toISOString(),
        uploadedBy: "You",
        paymentItems: [],
      };

      // Thumb is empty string for IFC (no canvas preview at upload time)
      onUpload(model, "");
      setFile(null);
      onOpenChange(false);
    } catch (e) {
      setError("Failed to process file. Please check the format.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface shadow-elevated p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">Upload model</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition
            ${dragging ? "border-primary bg-accent" : "border-border hover:border-primary/50 hover:bg-accent/50"}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept.join(",")}
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] && handleFile(e.target.files[0])
            }
          />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileBox className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-8 w-8 opacity-40" />
              <p className="text-sm">
                Drop your file here or{" "}
                <span className="text-primary font-medium">browse</span>
              </p>
              <p className="text-xs opacity-60">
                Supports .ifc and .json (BufferGeometry)
              </p>
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

        {/* IFC notice */}
        {file?.name.endsWith(".ifc") && (
          <p className="mt-3 text-xs text-muted-foreground bg-accent rounded-lg px-3 py-2">
            IFC files are converted to Fragments on first load in the viewer.
            This may take a moment depending on model size.
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 rounded-md border border-border text-sm hover:bg-accent transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing…" : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
