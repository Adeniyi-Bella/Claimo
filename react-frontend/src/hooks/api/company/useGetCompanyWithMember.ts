import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { CompanyApi } from "@/api/company.api";
import { UnauthorizedError } from "@/api/error/customeError";
import type { ICompanyWithMember } from "@/api/dto/responseDto";

export const companyQueryKey = ["company", "profile"] as const;

export function useGetCompanyWithMember() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery<ICompanyWithMember>({
    queryKey: companyQueryKey,
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401);
      }
      return CompanyApi.getUserCompanyWthMembers(token);
    },
    enabled: isLoaded && isSignedIn,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}