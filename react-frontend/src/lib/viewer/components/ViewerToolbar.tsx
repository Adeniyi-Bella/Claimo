import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Box,
  Grid3x3,
  Palette,
  Camera,
  X,
  Download,
} from "lucide-react";
import { Switch } from "@/components/common/switch";
import { Button } from "@/components/common/button";
import { useViewerStore } from "../state/store";
import { useViewerSettings } from "../hooks/useViewerSettings";

export function ViewerToolbar({
  modelName,
  projectId,
  status,
  onResetCamera,
  onExportIfc,
}: {
  modelName: string;
  projectId: string;
  status: "idle" | "loading" | "converting" | "ready" | "error";
  onResetCamera?: () => void;
  onExportIfc?: () => void;
}) {
  const clearSelection = useViewerStore((s) => s.clearSelection);
  const selectedCount = useViewerStore((s) => s.selectedIds.size);
  const {
    showEdges,
    colorByStatus,
    backgroundDark,
    setShowEdges,
    setColorByStatus,
    toggleBackground,
  } = useViewerSettings();

  return (
    <header
      className="h-12 flex items-center justify-between px-3 border-b shrink-0"
      style={{
        background: "var(--viewer-toolbar)",
        borderColor: "var(--viewer-panel-border)",
      }}
    >
      <div className="flex items-center gap-3">
        <Link
          to="/projects/$projectId"
          params={{ projectId }}
          search={{ tab: "Models" } as any}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Project
        </Link>
        <div
          className="h-5 w-px"
          style={{ background: "var(--viewer-panel-border)" }}
        />
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-6 rounded flex items-center justify-center"
            style={{
              background: "oklch(0.7 0.13 255 / 15%)",
              border: "1px solid oklch(0.7 0.13 255 / 40%)",
            }}
          >
            <Box className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="leading-tight">
            <div className="text-xs font-semibold text-foreground">
              {modelName}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {status === "loading" && "Initialising…"}
              {status === "converting" && "Converting IFC…"}
              {status === "ready" && "IFC · Ready"}
              {status === "error" && "Load error"}
              {status === "idle" && "IFC"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <Palette className="h-3.5 w-3.5" />
          Color by claim
          <Switch
            checked={colorByStatus}
            onCheckedChange={setColorByStatus}
            className="data-[state=checked]:bg-primary"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <Grid3x3 className="h-3.5 w-3.5" />
          Edges
          <Switch
            checked={showEdges}
            onCheckedChange={setShowEdges}
            className="data-[state=checked]:bg-primary"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          Background
          <Switch
            checked={backgroundDark}
            onCheckedChange={toggleBackground}
            className="data-[state=checked]:bg-primary"
          />
        </label>
        <div
          className="h-5 w-px"
          style={{ background: "var(--viewer-panel-border)" }}
        />
        {selectedCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 text-xs bg-transparent border-border hover:bg-accent"
            onClick={clearSelection}
          >
            <X className="h-3.5 w-3.5" />
            Clear ({selectedCount})
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs bg-transparent border-border hover:bg-accent"
          onClick={onExportIfc}
          disabled={status !== "ready"}
        >
          <Download className="h-3.5 w-3.5" />
          Export IFC
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-xs bg-transparent border-border hover:bg-accent"
          onClick={onResetCamera}
          disabled={!onResetCamera || status !== "ready"}
        >
          <Camera className="h-3.5 w-3.5" />
          Reset view
        </Button>
      </div>
    </header>
  );
}
