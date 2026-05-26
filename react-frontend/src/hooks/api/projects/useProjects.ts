import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { UnauthorizedError } from "@/api/error/customeError";
import { ProjectApi } from "@/api/project.api";
import type { ProjectsPageResponse } from "@/api/dto/responseDto";

export const projectsQueryKey = ["projects"] as const;

export function useProjects() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery<ProjectsPageResponse[]>({
    queryKey: projectsQueryKey,
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401);
      }
      return ProjectApi.getProjects(token);
    },
    enabled: isLoaded && isSignedIn,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

