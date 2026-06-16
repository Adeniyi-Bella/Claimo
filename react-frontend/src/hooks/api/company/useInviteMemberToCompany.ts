import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InviteCompanyMemberRequestDto } from "@/api/dto/requestDto";
import { companyQueryKey } from "./useGetCompanyWithMember";
import { CompanyApi } from "@/api/company.api";

export function useInviteMemberToCompany(companyId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InviteCompanyMemberRequestDto) => {
      if (!companyId) return;
      return CompanyApi.inviteMemberToCompany(companyId, data);
    },
    onSuccess: () => {
      void queryClient.refetchQueries({ queryKey: companyQueryKey });
    },
  });
}
