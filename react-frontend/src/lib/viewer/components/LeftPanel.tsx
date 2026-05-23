import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/common/tabs";
import { Button } from "@/components/common/button";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  ListTree,
  Trees,
} from "lucide-react";
import {
  useCallback,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { IfcTreePanel } from "./panels/IfcTreePanel";
import { PaymentTreePanel } from "./panels/PaymentTreePanel";
import { LegendPanel } from "./panels/LegendPanel";
import {
  VIEWER_LEFT_PANEL_DEFAULT_WIDTH,
  VIEWER_PANEL_COLLAPSED_WIDTH,
  VIEWER_PANEL_MAX_WIDTH,
  VIEWER_PANEL_MIN_WIDTH,
  startPanelResize,
} from "./panelResize";
import { useViewerStore } from "../state/store";

export function LeftPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const collapsed = useViewerStore((s) => s.leftPanelCollapsed);
  const width = useViewerStore((s) => s.leftPanelWidth);
  const toggle = useViewerStore((s) => s.toggleLeftPanel);
  const setWidth = useViewerStore((s) => s.setLeftPanelWidth);

  const handleResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const panel = panelRef.current;
      if (!panel) return;
      startPanelResize(event, {
        side: "left",
        panel,
        startWidth: width || VIEWER_LEFT_PANEL_DEFAULT_WIDTH,
        minWidth: VIEWER_PANEL_MIN_WIDTH,
        maxWidth: VIEWER_PANEL_MAX_WIDTH,
        onCommit: setWidth,
      });
    },
    [setWidth, width],
  );

  return (
    <aside
      ref={panelRef}
      className="relative flex shrink-0 flex-col border-r overflow-hidden"
      style={{
        width: collapsed ? VIEWER_PANEL_COLLAPSED_WIDTH : width,
        background: "var(--viewer-panel)",
        borderColor: "var(--viewer-panel-border)",
      }}
    >
      {collapsed ? (
        <div className="flex h-full items-center justify-center">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-md border border-transparent text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={toggle}
            aria-label="Expand left panel"
            title="Expand left panel"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <div
            className="h-10 px-3 flex items-center justify-between border-b shrink-0"
            style={{ borderColor: "var(--viewer-panel-border)" }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <ListTree className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wider text-foreground truncate">
                  Model Explorer
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  IFC tree, payment tree, legend
                </div>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={toggle}
              aria-label="Collapse left panel"
              title="Collapse left panel"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <Tabs defaultValue="ifc" className="flex flex-col flex-1 min-h-0">
            <TabsList
              className="grid grid-cols-3 mx-2 my-2 h-8"
              style={{ background: "oklch(1 0 0 / 5%)" }}
            >
              <TabsTrigger
                value="ifc"
                className="text-xs gap-1 data-[state=active]:bg-accent data-[state=active]:text-foreground"
              >
                <Trees className="h-3.5 w-3.5" />
                IFC
              </TabsTrigger>
              <TabsTrigger
                value="tree"
                className="text-xs gap-1 data-[state=active]:bg-accent data-[state=active]:text-foreground"
              >
                <ListTree className="h-3.5 w-3.5" />
                Pay
              </TabsTrigger>
              <TabsTrigger
                value="legend"
                className="text-xs gap-1 data-[state=active]:bg-accent data-[state=active]:text-foreground"
              >
                <Layers className="h-3.5 w-3.5" />
                Legend
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="ifc"
              className="flex-1 overflow-hidden px-3 pb-3 mt-0"
            >
              <IfcTreePanel />
            </TabsContent>

            <TabsContent
              value="tree"
              className="flex-1 overflow-hidden px-3 pb-3 mt-0"
            >
              <PaymentTreePanel />
            </TabsContent>

            <TabsContent value="legend" className="px-3 pb-3 mt-0">
              <LegendPanel />
            </TabsContent>
          </Tabs>

          <div
            className="absolute inset-y-0 right-0 z-30 w-1 cursor-col-resize hover:bg-primary/20"
            onPointerDown={handleResizePointerDown}
            aria-hidden="true"
          />
        </>
      )}
    </aside>
  );
}
