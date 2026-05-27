import { apiClient } from "@/api/clients/axiosClient";
import { requireApiData } from "@/api/response";
import type { CustomApiResponse, ProjectResponse } from "@/api/dto/responseDto";
import type { CreateProjectRequestDto } from "@/api/dto/requestDto";

export class ProjectApi {
  static async createProject(
    token: string,
    data: CreateProjectRequestDto,
  ): Promise<void> {
    const response = await apiClient.post<CustomApiResponse<void>>(
      "/projects",
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return requireApiData(response.data, {
      message: "Create project response missing data",
      code: "EMPTY_CREATE_PROJECT_RESPONSE",
      statusCode: response.status,
    });
  }

  static async getProjects(token: string): Promise<ProjectResponse[]> {
    const response = await apiClient.get<CustomApiResponse<ProjectResponse[]>>(
      "/projects",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return requireApiData(response.data, {
      message: "Projects response missing data",
      code: "EMPTY_PROJECTS_RESPONSE",
      statusCode: response.status,
    });
  }

  static async getProjectById(
    token: string,
    projectId: string,
  ): Promise<ProjectResponse> {
    const response = await apiClient.get<CustomApiResponse<ProjectResponse>>(
      `/projects/${projectId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return requireApiData(response.data, {
      message: "Project response missing data",
      code: "EMPTY_PROJECT_RESPONSE",
      statusCode: response.status,
    });
  }
}
