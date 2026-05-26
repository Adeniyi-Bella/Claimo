import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ProjectApi } from "@/api/project.api";
import { UnauthorizedError } from "@/api/error/customeError";
import type { CreateProjectData } from "@/types";
import { dashboardQueryKey } from "@/hooks/api/useDashboard";

export function useCreateProject() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const token = await getToken();
      if (!token) {
        throw new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401);
      }

      return ProjectApi.createProject(token, {
        name: data.name,
        description: data.description || null,
        location: data.location || null,
        startDate: data.startDate || null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
  });

  return {
    createProject: mutation.mutateAsync,
    isCreating: mutation.isPending,
    canCreate: isLoaded && isSignedIn,
  };
}
