import { useAuth } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

import { ProjectApi } from "@/api/project.api";
import { UnauthorizedError } from "@/api/error/customeError";
import type { ProjectResponse } from "@/api/dto/responseDto";

export const projectQueryKey = (projectId: string) =>
  ["projects", projectId] as const;

export function useProject(projectId: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery<ProjectResponse>({
    queryKey: projectQueryKey(projectId),
    queryFn: async () => {
      const token = await getToken();
      if (!token) {
        throw new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401);
      }
      return ProjectApi.getProjectById(token, projectId);
    },
    enabled: isLoaded && isSignedIn && !!projectId,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
