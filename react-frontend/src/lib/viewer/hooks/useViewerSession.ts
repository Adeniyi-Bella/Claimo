import { useParams, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useViewerStore } from "../state/store";
import { getViewerProjectModels } from "../session";
import type { ViewerModelRecord, ViewerProjectRecord } from "../model";

export interface UseViewerSessionResult {
  projectId: string;
  modelId: string;
  project: ViewerProjectRecord | null;
  model: ViewerModelRecord | null;
  models: ViewerModelRecord[];
}

export function useViewerSession(): UseViewerSessionResult {
  const { projectId, modelId } = useParams({
    from: "/_authenticated/viewer/$projectId/$modelId",
  });
  const search = useSearch({
    from: "/_authenticated/viewer/$projectId/$modelId",
  }) as { modelIds?: string | null };

  const initStore = useViewerStore((state) => state.init);

  const { project, activeModel: model, models } = useMemo(
    () => getViewerProjectModels(projectId, modelId, search.modelIds),
    [projectId, modelId, search.modelIds],
  );

  useEffect(() => {
    if (project && models.length > 0 && model) {
      initStore(projectId, models, model.id);
    }
  }, [initStore, model, models, project, projectId]);

  return {
    projectId,
    modelId,
    project,
    model,
    models,
  };
}
