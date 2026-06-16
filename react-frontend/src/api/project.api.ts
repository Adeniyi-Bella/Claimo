import { apiClient } from "@/api/clients/axiosClient";
import { requireApiData, requireApiSuccess } from "@/api/response";
import type {
  CustomApiResponse,
  GetProjectsResponse,
  ProjectResponse,
} from "@/api/dto/responseDto";
import type {
  CreatePaymentItemRequestDto,
  CreateProjectRequestDto,
  InviteMemberRequestDto,
} from "@/api/dto/requestDto";

export class ProjectApi {
  static async createProject(
    data: CreateProjectRequestDto,
  ): Promise<void> {
    const response = await apiClient.post<CustomApiResponse<void>>(
      "/projects",
      data,
    );

    return requireApiData(response.data, {
      message: "Create project response missing data",
      code: "EMPTY_CREATE_PROJECT_RESPONSE",
      statusCode: response.status,
    });
  }

  static async getProjects(): Promise<GetProjectsResponse[]> {
    const response = await apiClient.get<
      CustomApiResponse<GetProjectsResponse[]>
    >("/projects", {
    });

    return requireApiData(response.data, {
      message: "Projects response missing data",
      code: "EMPTY_PROJECTS_RESPONSE",
      statusCode: response.status,
    });
  }

  static async getProjectById(
    projectId: string,
  ): Promise<ProjectResponse> {
    const response = await apiClient.get<CustomApiResponse<ProjectResponse>>(
      `/projects/${projectId}`,
    );

    return requireApiData(response.data, {
      message: "Project response missing data",
      code: "EMPTY_PROJECT_RESPONSE",
      statusCode: response.status,
    });
  }

  static async inviteMember(
    projectId: string,
    data: InviteMemberRequestDto,
  ): Promise<void> {
    const response = await apiClient.post<CustomApiResponse<void>>(
      `/projects/${projectId}/members`,
      data,
    );

    return requireApiSuccess(response.data, {
      message: "Failed to invite member",
      code: "INVITE_MEMBER_FAILED",
      statusCode: response.status,
    });
  }

  static async removeMember(
    projectId: string,
    userId: string,
  ): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`, {
    });
  }

  static async createPaymentItem(
    projectId: string,
    data: CreatePaymentItemRequestDto,
  ): Promise<PaymentItem> {
    const response = await apiClient.post<CustomApiResponse<PaymentItem>>(
      `/projects/${projectId}/payment-items`,
      data,
    );

    return requireApiData(response.data, {
      message: "Create payment item response missing data",
      code: "EMPTY_CREATE_PAYMENT_ITEM_RESPONSE",
      statusCode: response.status,
    });
  }
}
