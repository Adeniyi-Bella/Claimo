import type { DashboardMember, DashboardModel, ProjectStatus } from "../types";

export interface CustomApiErrorResponse {
  status: number;
  message: string;
}

export interface CustomApiResponse<T> {
  success: boolean;
  data: T | null;
  error: CustomApiErrorResponse | null;
  timestamp: string;
}

export interface ProjectsPageResponse {
  id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  status: ProjectStatus;
  members: DashboardMember[];
  models: DashboardModel[];
}