import type { ViewerModelRecord, ViewerProjectRecord } from "./model";
import { getProjectById, loadProjects } from "@/lib/project-storage";

export function loadViewerProjects(): ViewerProjectRecord[] {
  return loadProjects() as unknown as ViewerProjectRecord[];
}

export function getViewerProjectModel(
  projectId: string,
  modelId: string,
): {
  project: ViewerProjectRecord | null;
  model: ViewerModelRecord | null;
} {
  const project = getProjectById(projectId) as ViewerProjectRecord | null;
  const model =
    project?.models.find((item) => item.id === modelId) ?? null;

  return { project, model };
}

function parseModelIdList(modelIds: string | null | undefined): string[] {
  if (!modelIds) return [];
  return Array.from(
    new Set(
      modelIds
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  );
}

export function getViewerProjectModels(
  projectId: string,
  activeModelId: string,
  selectedModelIds?: string | null,
): {
  project: ViewerProjectRecord | null;
  models: ViewerModelRecord[];
  activeModel: ViewerModelRecord | null;
} {
  const project = getProjectById(projectId) as ViewerProjectRecord | null;
  if (!project) {
    return { project: null, models: [], activeModel: null };
  }

  const parsedIds = parseModelIdList(selectedModelIds);
  const selectedIds = parsedIds.length > 0 ? parsedIds : [activeModelId];
  const selectedSet = new Set(selectedIds);
  const models = project.models.filter((model) => selectedSet.has(model.id));
  const resolvedModels = models.length > 0 ? models : project.models.filter((model) => model.id === activeModelId);
  const activeModel =
    resolvedModels.find((item) => item.id === activeModelId) ??
    resolvedModels[0] ??
    null;

  return {
    project,
    models: resolvedModels,
    activeModel,
  };
}
