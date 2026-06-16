import { apiClient } from "@/api/clients/axiosClient";
import { requireApiSuccess } from "@/api/response";
import type { CustomApiResponse } from "@/api/dto/responseDto";

export class UserApi {
  static async syncInvites(): Promise<void> {
    const response = await apiClient.post<CustomApiResponse<null>>(
      "/users/sync-invites",
      null,
    );

    requireApiSuccess(response.data, {
      message: "Invite sync failed",
      code: "USER_INVITE_SYNC_FAILED",
      statusCode: response.status,
    });
  }
}
