import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { DashboardApi } from "@/api/dashboard.api";
import { ApiError } from "@/api/error/customeError";
import type { DashboardResponse } from "@/api/dto/responseDto";

export const dashboardQueryKey = ["dashboard"] as const;

export function useDashboard() {
  const { isLoaded, isSignedIn } = useAuth();

  return useQuery<DashboardResponse>({
    queryKey: dashboardQueryKey,
    queryFn: () => DashboardApi.getDashboard(),
    enabled: isLoaded && isSignedIn,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: (failureCount, error) => {
      if (
        error instanceof ApiError &&
        error.statusCode === 404 &&
        failureCount < 5
      )
        return true;
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8000),
  });
}
