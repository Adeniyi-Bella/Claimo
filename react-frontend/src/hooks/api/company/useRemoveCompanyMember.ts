import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CompanyApi } from "@/api/company.api";
import { companyQueryKey } from "./useGetCompanyWithMember";

export function useRemoveCompanyMember(companyId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      if (!companyId) return;
      return CompanyApi.removeMember(companyId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey });
    },
  });
}
