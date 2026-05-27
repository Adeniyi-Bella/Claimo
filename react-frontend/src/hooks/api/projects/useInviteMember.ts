import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";

import { ProjectApi } from "@/api/project.api";
import { projectQueryKey } from "@/hooks/api/projects/useProject";
import { UnauthorizedError } from "@/api/error/customeError";
import type { InviteMemberRequestDto } from "@/api/dto/requestDto";
import { dashboardQueryKey } from "../useDashboard";

export function useInviteMember(projectId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InviteMemberRequestDto) => {
      const token = await getToken();
      if (!token) {
        throw new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401);
      }
      return ProjectApi.inviteMember(token, projectId, data);
    },
    onSuccess: () => {
      void queryClient.refetchQueries({ queryKey: projectQueryKey(projectId) });
      void queryClient.refetchQueries({ queryKey: dashboardQueryKey });
    },
  });
}