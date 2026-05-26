import type { ProjectRole } from "../types";

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

export interface ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: string | null;
  companyId: string;
  createdBy: string;
  role: ProjectRole | null;
  createdAt: string;
  updatedAt: string;
}