import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ModelApi } from "@/api/model.api";
import { projectQueryKey } from "@/hooks/api/projects/useProject";
import { saveModelFile, deleteModelFile } from "@/lib/model-storage";
import { deleteFragmentCache } from "@/lib/viewer/cache";

export const modelMutationKeys = {
  upload: (projectId: string) => ["models", projectId, "upload"] as const,
  delete: (projectId: string) => ["models", projectId, "delete"] as const,
};

export function useUploadModel(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: modelMutationKeys.upload(projectId),
    mutationFn: async ({
      modelId,
      fileName,
      file,
    }: {
      modelId: string;
      fileName: string;
      file: File;
    }) => {
      const buffer = await file.arrayBuffer();
      await saveModelFile(modelId, buffer);

      return ModelApi.uploadModel(projectId, modelId, fileName, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKey(projectId) });
    },
  });
}

export function useDeleteModel(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: modelMutationKeys.delete(projectId),
    mutationFn: async (modelId: string) => {
      await deleteModelFile(modelId);
      await deleteFragmentCache(modelId);
      await ModelApi.deleteModel(projectId, modelId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKey(projectId) });
    },
  });
}
