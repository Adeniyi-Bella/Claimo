import { Loader2 } from "lucide-react";
import type { RefObject } from "react";
import { useViewerStore } from "../state/store";

export function ViewerViewport({
  containerRef,
  status,
  canvasBackground,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  status: "idle" | "loading" | "converting" | "ready" | "error";
  canvasBackground: string;
}) {
  const selectedElementInfo = useViewerStore(
    (state) => state.selectedElementInfo,
  );
  const selectedCount = useViewerStore((state) => state.selectedIds.size);
  const tilesLoading = useViewerStore((s) => s.tilesLoading);

  return (
    <main
      className="flex-1 relative min-w-0"
      style={{ background: canvasBackground }}
    >
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ background: canvasBackground }}
      />

      {status !== "ready" && status !== "error" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20"
          style={{ background: canvasBackground }}
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
      {tilesLoading && status === "ready" && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20"
          style={{ background: "oklch(0.1 0.02 255 / 60%)" }}
        >
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-sm font-medium text-foreground">
            Loading tiles from Cesium Ion…
          </div>
        </div>
      )}

      <div
        className="absolute bottom-4 left-4 w-[320px] max-w-[calc(100vw-2rem)] rounded-md border px-3 py-2 text-[10px] font-medium z-10 backdrop-blur"
        style={{
          background: "oklch(0.17 0.02 255 / 90%)",
          borderColor: "var(--viewer-panel-border)",
        }}
      >
        <div className="uppercase tracking-wider text-muted-foreground mb-1.5">
          Selected element
        </div>

        {selectedElementInfo ? (
          <div className="space-y-2">
            <div>
              <div className="text-xs font-semibold text-foreground truncate">
                {selectedElementInfo.label}
              </div>
              <div className="mt-0.5 text-[9px] text-muted-foreground font-mono">
                {selectedElementInfo.modelId} · #{selectedElementInfo.localId}
              </div>
            </div>

            <div
              className="max-h-48 overflow-auto rounded border"
              style={{ borderColor: "var(--viewer-panel-border)" }}
            >
              <table className="w-full border-collapse">
                <tbody>
                  {Object.entries(selectedElementInfo.data)
                    .slice(0, 10)
                    .map(([key, value]) => (
                      <tr
                        key={key}
                        className="border-t first:border-t-0"
                        style={{ borderColor: "var(--viewer-panel-border)" }}
                      >
                        <td className="w-1/3 px-2 py-1 align-top text-[9px] uppercase tracking-wide text-muted-foreground font-mono">
                          {key}
                        </td>
                        <td className="px-2 py-1 align-top text-[10px] text-foreground wrap-break-word">
                          {formatValue(value)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {selectedCount > 1 && (
              <div className="text-[9px] text-muted-foreground">
                {selectedCount} elements selected. Showing the most recent one.
              </div>
            )}

            <div
              className="pt-2 border-t text-muted-foreground leading-snug"
              style={{ borderColor: "var(--viewer-panel-border)" }}
            >
              Click · select &nbsp;|&nbsp; Shift · multi
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground leading-snug">
            Click a 3D element to inspect its properties.
          </div>
        )}
      </div>

      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <p className="text-sm text-destructive bg-surface/80 px-4 py-2 rounded-lg border border-border">
            Failed to load model. Check the console for details.
          </p>
        </div>
      )}
    </main>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  try {
    const json = JSON.stringify(value);
    if (!json) return "—";
    return json.length > 120 ? `${json.slice(0, 117)}...` : json;
  } catch {
    return String(value);
  }
}
