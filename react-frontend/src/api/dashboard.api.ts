import { apiClient } from "@/api/clients/axiosClient";
import { requireApiData } from "@/api/response";
import type { CustomApiResponse, DashboardResponse } from "@/api/dto/responseDto";

export class DashboardApi {
  static async getDashboard(token: string): Promise<DashboardResponse> {
    const response = await apiClient.get<CustomApiResponse<DashboardResponse>>(
      "/users/dashboard",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return requireApiData(response.data, {
      message: "Dashboard response missing data",
      code: "EMPTY_DASHBOARD_RESPONSE",
      statusCode: response.status,
    });
  }
}
