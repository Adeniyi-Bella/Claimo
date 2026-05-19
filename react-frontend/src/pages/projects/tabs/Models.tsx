import type { Project } from "@/lib/mock-data";
import { fmtDate, modelSummary } from "@/lib/mock-data";
import { Boxes, Upload } from "lucide-react";

export default function ModelsTab({
  project,
  onUpload,
  modelThumbs = {},
}: {
  project: Project;
  onUpload: () => void;
  modelThumbs?: Record<string, string>;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {project.models.length} model{project.models.length !== 1 ? "s" : ""}{" "}
          in this project
        </div>
        <button
          onClick={onUpload}
          className="h-9 px-3.5 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition shadow-soft"
        >
          <Upload className="h-4 w-4" /> Upload model
        </button>
      </div>

      {project.models.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-12 text-center shadow-soft">
          <div className="mx-auto h-14 w-14 rounded-xl bg-accent text-primary inline-flex items-center justify-center">
            <Boxes className="h-6 w-6" />
          </div>
          <h2 className="mt-5 text-base font-semibold tracking-tight">
            No models yet
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
            Upload a Three.js BufferGeometry JSON file to get started. Models
            are the foundation for linking payment claims to real building
            elements.
          </p>
          <button
            onClick={onUpload}
            className="mt-6 h-9 px-3.5 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition shadow-soft"
          >
            <Upload className="h-4 w-4" /> Upload your first model
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {project.models.map((m) => {
            const s = modelSummary(m);
            const pct =
              s.total > 0 ? Math.round((s.approved / s.total) * 100) : 0;
            const thumb = modelThumbs[m.id];

            return (
              <div
                key={m.id}
                className="rounded-xl border border-border bg-surface shadow-soft hover:shadow-elevated hover:border-primary/30 transition overflow-hidden cursor-pointer"
              >
                {/* Thumbnail */}
                <div className="h-32 relative overflow-hidden bg-linear-to-br from-[oklch(0.93_0.02_250)] to-[oklch(0.83_0.05_250)]">
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={m.name}
                      className="w-full h-full object-contain p-4"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Boxes className="h-10 w-10 text-primary/30" />
                    </div>
                  )}
                  <span className="absolute top-2 right-2 text-[10px] font-mono bg-surface/80 backdrop-blur border border-border rounded px-1.5 py-0.5 text-muted-foreground">
                    .json
                  </span>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="font-medium text-sm truncate">{m.name}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Uploaded {fmtDate(m.uploadedAt)} · {m.uploadedBy}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{m.paymentItems.length} payment items</span>
                    <span className="tabular-nums">{pct}% paid</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
