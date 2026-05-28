import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { CompanyApi } from "@/api/company.api";
import { UnauthorizedError } from "@/api/error/customeError";
import { companyQueryKey } from "./useGetCompanyWithMember";

export function useCancelCompanyInvite(companyId: string | undefined) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      if (!companyId) return;
      const token = await getToken();
      if (!token) {
        throw new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401);
      }
      return CompanyApi.cancelInvite(token, companyId, inviteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey });
    },
  });
}