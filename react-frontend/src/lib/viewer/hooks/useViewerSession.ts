import { useParams } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useViewerStore } from "../state/store";
import { getViewerProjectModel } from "../session";
import type { ViewerModelRecord, ViewerProjectRecord } from "../model";

export interface UseViewerSessionResult {
  projectId: string;
  modelId: string;
  project: ViewerProjectRecord | null;
  model: ViewerModelRecord | null;
}

export function useViewerSession(): UseViewerSessionResult {
  const { projectId, modelId } = useParams({
    from: "/_authenticated/viewer/$projectId/$modelId",
  });

  const initStore = useViewerStore((state) => state.init);

  const { project, model } = useMemo(
    () => getViewerProjectModel(projectId, modelId),
    [projectId, modelId],
  );

  useEffect(() => {
    if (project && model) {
      initStore(projectId, modelId, model.name);
    }
  }, [initStore, model, modelId, project, projectId]);

  return {
    projectId,
    modelId,
    project,
    model,
  };
}
