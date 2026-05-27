import { apiClient } from "@/api/clients/axiosClient";
import { requireApiData } from "@/api/response";
import type { CustomApiResponse, ICompanyWithMember } from "@/api/dto/responseDto";

export class CompanyApi {
  static async getUserCompanyWthMembers(token: string): Promise<ICompanyWithMember> {
    const response = await apiClient.get<CustomApiResponse<ICompanyWithMember>>(
      "/companies/profile",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return requireApiData(response.data, {
      message: "Company response missing data",
      code: "EMPTY_COMPANY_RESPONSE",
      statusCode: response.status,
    });
  }
}