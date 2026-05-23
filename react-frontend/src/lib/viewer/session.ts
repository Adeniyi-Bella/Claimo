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
