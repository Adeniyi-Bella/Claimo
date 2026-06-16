import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { CompanyApi } from "@/api/company.api";
import type { ICompanyWithMember } from "@/api/dto/responseDto";

export const companyQueryKey = ["company", "profile"] as const;

export function useGetCompanyWithMember() {
  const { isLoaded, isSignedIn } = useAuth();

  return useQuery<ICompanyWithMember>({
    queryKey: companyQueryKey,
    queryFn: async () => CompanyApi.getUserCompanyWthMembers(),

    enabled: isLoaded && isSignedIn,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
