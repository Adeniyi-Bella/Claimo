import { useMutation, useQueryClient } from "@tanstack/react-query";

import { CompanyApi } from "@/api/company.api";
import { companyQueryKey } from "./useGetCompanyWithMember";

export function useCancelCompanyInvite(companyId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      if (!companyId) return;
      return CompanyApi.cancelInvite(companyId, inviteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey });
    },
  });
}
