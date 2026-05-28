import { apiClient } from "@/api/clients/axiosClient";
import { requireApiData, requireApiSuccess } from "@/api/response";
import type {
  CustomApiResponse,
  ICompanyWithMember,
} from "@/api/dto/responseDto";
import type { InviteCompanyMemberRequestDto } from "./dto/requestDto";

export class CompanyApi {
  static async getUserCompanyWthMembers(
    token: string,
  ): Promise<ICompanyWithMember> {
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

  static async inviteMemberToCompany(
    token: string,
    companyId: string,
    data: InviteCompanyMemberRequestDto,
  ): Promise<void> {
    const response = await apiClient.post<CustomApiResponse<void>>(
      `/companies/${companyId}/members`,
      data,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    return requireApiSuccess(response.data, {
      message: "Failed to invite member",
      code: "INVITE_MEMBER_FAILED",
      statusCode: response.status,
    });
  }

  static async cancelInvite(
    token: string,
    companyId: string,
    inviteId: string,
  ): Promise<void> {
    await apiClient.delete(
      `/companies/${companyId}/members/invites/${inviteId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }
}
