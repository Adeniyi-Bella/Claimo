import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";

import { UnauthorizedError } from "@/api/error/customeError";
import type { InviteCompanyMemberRequestDto } from "@/api/dto/requestDto";
import { companyQueryKey } from "./useGetCompanyWithMember";
import { CompanyApi } from "@/api/company.api";

export function useInviteMemberToCompany(companyId: string | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InviteCompanyMemberRequestDto) => {
      if (!companyId) return;
      const token = await getToken();
      if (!token) {
        throw new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401);
      }
      return CompanyApi.inviteMemberToCompany(token, companyId, data);
    },
    onSuccess: () => {
      void queryClient.refetchQueries({ queryKey: companyQueryKey });
    },
  });
}
