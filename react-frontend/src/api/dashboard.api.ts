import { apiClient } from "@/api/clients/axiosClient";
import { requireApiData } from "@/api/response";
import type { CustomApiResponse, DashboardResponse } from "@/api/dto/responseDto";

export class DashboardApi {
  static async getDashboard(): Promise<DashboardResponse> {
    const response = await apiClient.get<CustomApiResponse<DashboardResponse>>(
      "/projects/dashboard",
    );

    return requireApiData(response.data, {
      message: "Dashboard response missing data",
      code: "EMPTY_DASHBOARD_RESPONSE",
      statusCode: response.status,
    });
  }
}
