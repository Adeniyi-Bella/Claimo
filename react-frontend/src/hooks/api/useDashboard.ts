import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { DashboardApi } from "@/api/dashboard.api";
import { UnauthorizedError } from "@/api/error/customeError";
import type { DashboardResponse } from "@/api/types";

export const dashboardQueryKey = ["dashboard"] as const;

export function useDashboard() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery<DashboardResponse>({
    queryKey: dashboardQueryKey,
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401);
      }
      return DashboardApi.getDashboard(token);
    },
    enabled: isLoaded && isSignedIn,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 30,
  });
}
