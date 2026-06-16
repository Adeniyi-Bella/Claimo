import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ProjectApi } from "@/api/project.api";
import { dashboardQueryKey } from "@/hooks/api/useDashboard";
import type {
  CreatePaymentItemRequestDto,
  InviteMemberRequestDto,
} from "@/api/dto/requestDto";
import type {
  GetProjectsResponse,
  ProjectResponse,
} from "@/api/dto/responseDto";
import type { CreateProjectData } from "@/types";

// Query Keys
export const projectsQueryKey = ["projects"] as const;
export const projectQueryKey = (projectId: string) =>
  ["projects", projectId] as const;

// Hooks
export function useGetProjects() {
  const { isLoaded, isSignedIn } = useAuth();

  return useQuery<GetProjectsResponse[]>({
    queryKey: projectsQueryKey,
    queryFn: async () => ProjectApi.getProjects(),
    enabled: isLoaded && isSignedIn,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useGetProject(projectId: string) {
  const { isLoaded, isSignedIn } = useAuth();

  return useQuery<ProjectResponse>({
    queryKey: projectQueryKey(projectId),
    queryFn: async () => ProjectApi.getProjectById(projectId),
    enabled: isLoaded && isSignedIn && !!projectId,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useCreateProject() {
  const { isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      return ProjectApi.createProject({
        name: data.name,
        description: data.description || null,
        location: data.location || null,
        startDate: data.startDate || null,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
      await queryClient.invalidateQueries({ queryKey: projectsQueryKey });
    },
  });

  return {
    createProject: mutation.mutateAsync,
    isCreating: mutation.isPending,
    canCreate: isLoaded && isSignedIn,
  };
}

export function useInviteMemberToProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InviteMemberRequestDto) => {
      return ProjectApi.inviteMember(projectId, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: projectQueryKey(projectId),
      });
    },
  });
}

export function useRemoveMemberFromProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      return ProjectApi.removeMember(projectId, userId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: projectQueryKey(projectId),
      });
    },
  });
}

export function useCreatePaymentItem(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentItemRequestDto) => {
      return ProjectApi.createPaymentItem(projectId, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: projectQueryKey(projectId),
      });
    },
    retry: false,
  });
}
