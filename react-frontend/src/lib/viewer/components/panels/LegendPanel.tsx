import { useViewerStore } from "../../state/store";

export function LegendPanel() {
  const colorByStatus = useViewerStore((s) => s.colorByStatus);

  const statusItems = [
    { label: "Approved", bg: "var(--status-approved)" },
    { label: "Submitted", bg: "var(--status-submitted)" },
    { label: "Rejected", bg: "var(--status-rejected)" },
    { label: "Unclaimed", bg: "var(--status-neutral)" },
    { label: "Selected", bg: "var(--status-selected)" },
  ];

  return (
    <div className="space-y-4 text-xs">
      <div>
        <div
          className="text-[10px] uppercase tracking-wider mb-2"
          style={{ color: "var(--viewer-panel-border)" }}
        >
          Claim status colours
        </div>
        <div className="space-y-2">
          {statusItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ background: item.bg }}
              />
              <span className="text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="pt-3 border-t text-[10px] text-muted-foreground leading-relaxed space-y-1"
        style={{ borderColor: "var(--viewer-panel-border)" }}
      >
        <div>Click element → select</div>
        <div>Shift / Ctrl + click → multi-select</div>
        <div>Right panel → attach to payment</div>
      </div>

      {!colorByStatus && (
        <div
          className="text-[10px] text-muted-foreground italic pt-2 border-t"
          style={{ borderColor: "var(--viewer-panel-border)" }}
        >
          Enable "Color by claim" in toolbar to see claim status colours
        </div>
      )}
    </div>
  );
}
