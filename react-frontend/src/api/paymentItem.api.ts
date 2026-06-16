import { apiClient } from "@/api/clients/axiosClient";
import { requireApiData } from "@/api/response";
import type { CustomApiResponse } from "@/api/dto/responseDto";
import type {
  DecideClaimRequestDto,
  SubmitClaimRequestDto,
  UpdateJobStatusRequestDto,
  UpdatePaymentStatusRequestDto,
} from "@/api/dto/requestDto";
import type { PaymentItem } from "@/api/dto/responseDto";

export class PaymentItemApi {
  static async getPaymentItemById(
    token: string,
    projectId: string,
    itemId: string,
  ): Promise<PaymentItem> {
    const response = await apiClient.get<CustomApiResponse<PaymentItem>>(
      `/projects/${projectId}/payment-items/${itemId}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    return requireApiData(response.data, {
      message: "Payment item response missing data",
      code: "EMPTY_PAYMENT_ITEM_RESPONSE",
      statusCode: response.status,
    });
  }

  static async submitClaim(
    token: string,
    projectId: string,
    itemId: string,
    data: SubmitClaimRequestDto,
  ): Promise<PaymentItem> {
    const response = await apiClient.post<CustomApiResponse<PaymentItem>>(
      `/projects/${projectId}/payment-items/${itemId}/claims`,
      data,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    return requireApiData(response.data, {
      message: "Submit claim response missing data",
      code: "EMPTY_SUBMIT_CLAIM_RESPONSE",
      statusCode: response.status,
    });
  }

  static async decideClaim(
    token: string,
    projectId: string,
    itemId: string,
    claimId: string,
    data: DecideClaimRequestDto,
  ): Promise<PaymentItem> {
    const response = await apiClient.post<CustomApiResponse<PaymentItem>>(
      `/projects/${projectId}/payment-items/${itemId}/claims/${claimId}/decide`,
      data,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return requireApiData(response.data, {
      message: "Decide claim response missing data",
      code: "EMPTY_DECIDE_CLAIM_RESPONSE",
      statusCode: response.status,
    });
  }

  static async updateJobStatus(
    token: string,
    projectId: string,
    itemId: string,
    data: UpdateJobStatusRequestDto,
  ): Promise<PaymentItem> {
    const response = await apiClient.patch<CustomApiResponse<PaymentItem>>(
      `/projects/${projectId}/payment-items/${itemId}/job-status`,
      data,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return requireApiData(response.data, {
      message: "Update job status response missing data",
      code: "EMPTY_UPDATE_JOB_STATUS_RESPONSE",
      statusCode: response.status,
    });
  }

  static async updatePaymentStatus(
    token: string,
    projectId: string,
    itemId: string,
    data: UpdatePaymentStatusRequestDto,
  ): Promise<PaymentItem> {
    const response = await apiClient.patch<CustomApiResponse<PaymentItem>>(
      `/projects/${projectId}/payment-items/${itemId}/payment-status`,
      data,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return requireApiData(response.data, {
      message: "Update payment status response missing data",
      code: "EMPTY_UPDATE_PAYMENT_STATUS_RESPONSE",
      statusCode: response.status,
    });
  }

  static async confirmPayment(
    token: string,
    projectId: string,
    itemId: string,
    confirmed: boolean,
  ): Promise<PaymentItem> {
    const response = await apiClient.post<CustomApiResponse<PaymentItem>>(
      `/projects/${projectId}/payment-items/${itemId}/confirm-payment`,
      { confirmed },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return requireApiData(response.data, {
      message: "Confirm payment response missing data",
      code: "EMPTY_CONFIRM_PAYMENT_RESPONSE",
      statusCode: response.status,
    });
  }

  static async assignPaymentItem(
    token: string,
    projectId: string,
    itemId: string,
    data: { contractorId: string | null; approverId: string | null },
  ): Promise<PaymentItem> {
    const response = await apiClient.patch<CustomApiResponse<PaymentItem>>(
      `/projects/${projectId}/payment-items/${itemId}/assign`,
      data,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return requireApiData(response.data, {
      message: "Assign payment item response missing data",
      code: "EMPTY_ASSIGN_PAYMENT_ITEM_RESPONSE",
      statusCode: response.status,
    });
  }
}
