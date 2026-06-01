import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ProjectApi } from "@/api/project.api";
import { UnauthorizedError } from "@/api/error/customeError";
import { dashboardQueryKey } from "@/hooks/api/useDashboard";
import type { CreatePaymentItemRequestDto, InviteMemberRequestDto } from "@/api/dto/requestDto";
import type { ProjectResponse } from "@/api/dto/responseDto";
import type { CreateProjectData } from "@/types";

// Query Keys
export const projectsQueryKey = ["projects"] as const;
export const projectQueryKey = (projectId: string) =>
  ["projects", projectId] as const;

// Hooks
export function useGetProjects() {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery<ProjectResponse[]>({
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

export function useGetProject(projectId: string) {
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKey(projectId) });
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
  });
}

export function useRemoveMemberFromProject(projectId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const token = await getToken();
      if (!token) {
        throw new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401);
      }
      return ProjectApi.removeMember(token, projectId, userId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKey(projectId) });
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
  });
}

export function useCreatePaymentItem(projectId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentItemRequestDto) => {
      const token = await getToken();
      if (!token) {
        throw new UnauthorizedError("No active session", "AUTH_NO_TOKEN", 401);
      }
      return ProjectApi.createPaymentItem(token, projectId, data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: projectQueryKey(projectId) });
      await queryClient.invalidateQueries({ queryKey: projectQueryKey(projectId) });
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
    },
    retry: false,
  });
}