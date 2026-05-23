import { Loader2 } from "lucide-react";
import type { RefObject } from "react";

export function ViewerViewport({
  containerRef,
  status,
  canvasBackground,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  status: "idle" | "loading" | "converting" | "ready" | "error";
  canvasBackground: string;
}) {
  return (
    <main className="flex-1 relative min-w-0" style={{ background: canvasBackground }}>
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
            {status === "converting" && "Converting IFC, this may take a moment…"}
          </div>
        </div>
      )}

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
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2 mb-1">
            <span
              className="h-2.5 w-2.5 rounded-sm shrink-0"
              style={{ background: item.bg }}
            />
            <span className="text-muted-foreground">{item.label}</span>
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
  );
}
