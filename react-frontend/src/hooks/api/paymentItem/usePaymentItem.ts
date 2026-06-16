import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { UnauthorizedError } from "@/api/error/customeError";
import { PaymentItemApi } from "@/api/paymentItem.api";
import type {
  DecideClaimRequestDto,
  SubmitClaimRequestDto,
  UpdateJobStatusRequestDto,
  UpdatePaymentStatusRequestDto,
} from "@/api/dto/requestDto";
import { projectQueryKey } from "../projects/useProject";
import type { PaymentItem } from "@/api/dto/responseDto";

export const paymentItemQueryKey = (projectId: string, itemId: string) =>
  ["projects", projectId, "payment-items", itemId] as const;

export function usePaymentItem(projectId: string, itemId: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery<PaymentItem>({
    queryKey: paymentItemQueryKey(projectId, itemId),
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401);
      }
      return PaymentItemApi.getPaymentItemById(token, projectId, itemId);
    },
    enabled: isLoaded && isSignedIn && !!projectId && !!itemId,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSubmitClaim(projectId: string, itemId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmitClaimRequestDto) => {
      const token = await getToken();
      if (!token) {
        throw new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401);
      }
      return PaymentItemApi.submitClaim(token, projectId, itemId, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: paymentItemQueryKey(projectId, itemId),
      });
      await queryClient.invalidateQueries({
        queryKey: projectQueryKey(projectId),
      });
    },
    retry: false,
  });
}

export function useDecideClaim(projectId: string, itemId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      claimId,
      data,
    }: {
      claimId: string;
      data: DecideClaimRequestDto;
    }) => {
      const token = await getToken();
      if (!token)
        throw new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401);
      return PaymentItemApi.decideClaim(
        token,
        projectId,
        itemId,
        claimId,
        data,
      );
    },
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(
        paymentItemQueryKey(projectId, itemId),
        updatedItem,
      );
      void queryClient.invalidateQueries({
        queryKey: projectQueryKey(projectId),
      });
    },
    retry: false,
  });
}

export function useUpdateJobStatus(projectId: string, itemId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateJobStatusRequestDto) => {
      const token = await getToken();
      if (!token)
        throw new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401);
      return PaymentItemApi.updateJobStatus(token, projectId, itemId, data);
    },
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(
        paymentItemQueryKey(projectId, itemId),
        updatedItem,
      );
      void queryClient.invalidateQueries({
        queryKey: projectQueryKey(projectId),
      });
    },
    retry: false,
  });
}

export function useUpdatePaymentStatus(projectId: string, itemId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePaymentStatusRequestDto) => {
      const token = await getToken();
      if (!token)
        throw new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401);
      return PaymentItemApi.updatePaymentStatus(token, projectId, itemId, data);
    },
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(
        paymentItemQueryKey(projectId, itemId),
        updatedItem,
      );
      void queryClient.invalidateQueries({
        queryKey: projectQueryKey(projectId),
      });
    },
    retry: false,
  });
}

export function useConfirmPayment(projectId: string, itemId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (confirmed: boolean) => {
      const token = await getToken();
      if (!token) throw new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401);
      return PaymentItemApi.confirmPayment(token, projectId, itemId, confirmed);
    },
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(paymentItemQueryKey(projectId, itemId), updatedItem);
      void queryClient.invalidateQueries({ queryKey: projectQueryKey(projectId) });
    },
    retry: false,
  });
}

export function useAssignPaymentItem(projectId: string, itemId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { contractorId: string | null; approverId: string | null }) => {
      const token = await getToken();
      if (!token)
        throw new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401);
      return PaymentItemApi.assignPaymentItem(token, projectId, itemId, data);
    },
    onSuccess: (updatedItem) => {
      queryClient.setQueryData(
        paymentItemQueryKey(projectId, itemId),
        updatedItem,
      );
      void queryClient.invalidateQueries({
        queryKey: projectQueryKey(projectId),
      });
    },
    retry: false,
  });
}