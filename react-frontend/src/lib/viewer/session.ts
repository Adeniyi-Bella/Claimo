import type { ViewerModelRecord, ViewerProjectRecord } from "./model";

export const VIEWER_SESSION_KEY = "claimo:projects";

export function loadViewerProjects(): ViewerProjectRecord[] {
  try {
    const raw = sessionStorage.getItem(VIEWER_SESSION_KEY);
    return raw ? (JSON.parse(raw) as ViewerProjectRecord[]) : [];
  } catch {
    return [];
  }
}

export function getViewerProjectModel(
  projectId: string,
  modelId: string,
): {
  project: ViewerProjectRecord | null;
  model: ViewerModelRecord | null;
} {
  const projects = loadViewerProjects();
  const project = projects.find((item) => item.id === projectId) ?? null;
  const model =
    project?.models.find((item) => item.id === modelId) ?? null;

  return { project, model };
}
