import { apiClient } from "@/api/clients/axiosClient";
import { requireApiData } from "@/api/response";
import type { CustomApiResponse, ProjectResponse } from "@/api/dto/responseDto";
import type { CreateProjectRequestDto } from "@/api/dto/requestDto";

export class ProjectApi {
  static async createProject(
    token: string,
    data: CreateProjectRequestDto,
  ): Promise<ProjectResponse> {
    const response = await apiClient.post<CustomApiResponse<ProjectResponse>>(
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
}
