import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PaymentItemApi } from "@/api/paymentItem.api";
import type {
  CreatePaymentItemRequestDto,
  DecideClaimRequestDto,
  SubmitClaimRequestDto,
  UpdateJobStatusRequestDto,
  UpdatePaymentStatusRequestDto,
} from "@/api/dto/requestDto";
import { projectQueryKey, projectsQueryKey } from "../projects/useProject";
import type { PaymentItem } from "@/api/dto/responseDto";

export const paymentItemQueryKey = (projectId: string, itemId: string) =>
  ["projects", projectId, "payment-items", itemId] as const;

export function usePaymentItem(projectId: string, itemId: string) {
  const { isLoaded, isSignedIn } = useAuth();

  return useQuery<PaymentItem>({
    queryKey: paymentItemQueryKey(projectId, itemId),
    queryFn: async () => PaymentItemApi.getPaymentItemById(projectId, itemId),
    enabled: isLoaded && isSignedIn && !!projectId && !!itemId,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 2,
  });
}

export function useSubmitClaim(projectId: string, itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SubmitClaimRequestDto) => {
      return PaymentItemApi.submitClaim(projectId, itemId, data);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      claimId,
      data,
    }: {
      claimId: string;
      data: DecideClaimRequestDto;
    }) => {
      return PaymentItemApi.decideClaim(projectId, itemId, claimId, data);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateJobStatusRequestDto) => {
      return PaymentItemApi.updateJobStatus(projectId, itemId, data);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePaymentStatusRequestDto) => {
      return PaymentItemApi.updatePaymentStatus(projectId, itemId, data);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (confirmed: boolean) => {
      return PaymentItemApi.confirmPayment(projectId, itemId, confirmed);
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

export function useAssignPaymentItem(projectId: string, itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      contractorId: string | null;
      approverId: string | null;
    }) => {
      return PaymentItemApi.assignPaymentItem(projectId, itemId, data);
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

export function useCreatePaymentItem(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentItemRequestDto) => {
      return PaymentItemApi.createPaymentItem(projectId, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: projectQueryKey(projectId),
      });
      await queryClient.invalidateQueries({ queryKey: projectsQueryKey });
    },
    retry: false,
  });
}
