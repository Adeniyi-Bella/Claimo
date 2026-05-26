import { useEffect, useRef, useState } from "react";
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
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setDragging(false);
    setFiles([]);
    setError(null);
    setLoading(false);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);

  if (!open) return null;

  const accept = [".ifc"];

  const validateFiles = (nextFiles: File[]) => {
    const invalid = nextFiles.find((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase();
      return ext !== "ifc";
    });

    if (invalid) {
      setError("Only .ifc files are supported.");
      setFiles([]);
      return [];
    }

    setError(null);
    setFiles(nextFiles);
    return nextFiles;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) validateFiles(dropped);
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    setLoading(true);

    try {
      for (const file of files) {
        const ext = file.name.split(".").pop()?.toLowerCase() as ModelFileType;
        const id = crypto.randomUUID();

        // let geometryJson = undefined;
        let fileUrl = undefined;

        const buffer = await file.arrayBuffer();
        await saveModelFile(id, buffer);

        const model: ProjectModel = {
          id,
          name: file.name,
          fileType: ext,
          fileUrl,
          // geometryJson,
          uploadedAt: new Date().toISOString(),
          uploadedBy: "You",
          paymentItems: [],
        };

        onUpload(model, "");
      }
      setFiles([]);
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
            onClick={() => {
              resetState();
              onOpenChange(false);
            }}
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
            multiple
            accept={accept.join(",")}
            className="hidden"
            onChange={(e) => validateFiles(Array.from(e.target.files ?? []))}
          />
          {files.length > 0 ? (
            <div className="flex flex-col items-center gap-2">
              <FileBox className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">
                {files.length === 1
                  ? files[0].name
                  : `${files.length} files selected`}
              </span>
              <div className="text-xs text-muted-foreground space-y-0.5">
                {files.map((f) => (
                  <div key={`${f.name}-${f.size}`}>{f.name}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-8 w-8 opacity-40" />
              <p className="text-sm">
                Drop your file here or{" "}
                <span className="text-primary font-medium">browse</span>
              </p>
              <p className="text-xs opacity-60">
                Supports .ifc files and multiple ifc files uploads.
              </p>
            </div>
          )}
        </div>

        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

        {/* IFC notice */}
        {files.some((file) => file.name.endsWith(".ifc")) && (
          <p className="mt-3 text-xs text-muted-foreground bg-accent rounded-lg px-3 py-2">
            IFC files are converted to Fragments on first load in the viewer.
            This may take a moment depending on model size.
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={() => {
              resetState();
              onOpenChange(false);
            }}
            className="h-9 px-4 rounded-md border border-border text-sm hover:bg-accent transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={files.length === 0 || loading}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Processing…"
              : files.length > 1
                ? `Upload ${files.length} files`
                : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
