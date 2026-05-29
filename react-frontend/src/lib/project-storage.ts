import { useCallback, useEffect, useState } from "react";
import type { SetStateAction } from "react";

import type {  PaymentItem, ProjectModel } from "@/lib/mock-data";
import type { ProjectResponse } from "@/api/dto/responseDto";

export const PROJECTS_SESSION_KEY = "claimo:projects";
export const PROJECT_THUMBS_SESSION_KEY = "claimo:thumbs";
export const PROJECTS_STORAGE_EVENT = "claimo:projects-updated";

function readSessionValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeSessionValue<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(key, JSON.stringify(value));
}

function notifyProjectsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(PROJECTS_STORAGE_EVENT));
}

export function loadProjects(): ProjectResponse[] {
  return readSessionValue<ProjectResponse[]>(PROJECTS_SESSION_KEY, []);
}

export function saveProjects(projects: ProjectResponse[]) {
  writeSessionValue(PROJECTS_SESSION_KEY, projects);
  notifyProjectsChanged();
}

export function loadProjectThumbs(): Record<string, string> {
  return readSessionValue<Record<string, string>>(
    PROJECT_THUMBS_SESSION_KEY,
    {},
  );
}

export function saveProjectThumbs(thumbs: Record<string, string>) {
  writeSessionValue(PROJECT_THUMBS_SESSION_KEY, thumbs);
}

export function getProjectById(projectId: string): ProjectResponse | null {
  return loadProjects().find((project) => project.id === projectId) ?? null;
}

export function updateProjects(
  updater: (projects: ProjectResponse[]) => ProjectResponse[],
): ProjectResponse[] {
  const next = updater(loadProjects());
  saveProjects(next);
  return next;
}

export function updateProjectById(
  projectId: string,
  updater: (project: ProjectResponse) => ProjectResponse,
): ProjectResponse[] {
  return updateProjects((projects) =>
    projects.map((project) =>
      project.id === projectId ? updater(project) : project,
    ),
  );
}

export function addProjectModel(projectId: string, model: ProjectModel) {
  return updateProjectById(projectId, (project) => ({
    ...project,
    models: [...project.models, model],
  }));
}

export function removeProjectModel(projectId: string, modelId: string) {
  return updateProjectById(projectId, (project) => ({
    ...project,
    models: project.models.filter((model) => model.id !== modelId),
  }));
}

export function addProjectPaymentItem(projectId: string, item: PaymentItem) {
  return updateProjectById(projectId, (project) => ({
    ...project,
    models: project.models.map((model) =>
      model.id === item.modelId
        ? { ...model, paymentItems: [...model.paymentItems, item] }
        : model,
    ),
  }));
}

export function useProjectList() {
  const [projects, setProjectsState] = useState<ProjectResponse[]>(() =>
    loadProjects(),
  );

  const refreshProjects = useCallback(() => {
    setProjectsState(loadProjects());
  }, []);

  useEffect(() => {
    const sync = () => refreshProjects();

    sync();
    window.addEventListener(PROJECTS_STORAGE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(PROJECTS_STORAGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [refreshProjects]);

  const setProjects = useCallback((next: SetStateAction<ProjectResponse[]>) => {
    setProjectsState((current) => {
      const resolved = typeof next === "function" ? next(current) : next;
      saveProjects(resolved);
      return resolved;
    });
  }, []);

  return { projects, refreshProjects, setProjects };
}
