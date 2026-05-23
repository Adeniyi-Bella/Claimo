import { Link } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { LeftPanel } from "./components/LeftPanel";
import { RightPanel } from "./components/RightPanel";
import { ViewerToolbar } from "./components/ViewerToolbar";
import { ViewerViewport } from "./components/ViewerViewport";
import { useModelViewer } from "./hooks/useModelViewer";

export default function ModelViewer() {
  const {
    projectId,
    project,
    model,
    status,
    containerRef,
    handleResetCamera,
    canvasBackground,
  } = useModelViewer();

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
    <div
      className="dark flex flex-col h-screen w-screen overflow-hidden"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <ViewerToolbar
        modelName={model.name}
        projectId={projectId}
        status={status}
        onResetCamera={handleResetCamera}
      />

      <div className="flex flex-1 min-h-0">
        <LeftPanel />
        <ViewerViewport
          containerRef={containerRef}
          status={status}
          canvasBackground={canvasBackground}
        />
        <RightPanel />
      </div>
    </div>
  );
}
