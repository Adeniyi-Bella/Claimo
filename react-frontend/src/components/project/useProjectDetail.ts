import { useCallback, useEffect, useState } from "react";

import { useGetProject } from "@/hooks/api/projects/useProject";
import { loadProjectThumbs, updateProjects } from "@/lib/project-storage";
import { useDeleteModel } from "@/hooks/api/models/useModel";
import { useCreatePaymentItem } from "@/hooks/api/projects/useProject";
import type { CreatePaymentItemRequestDto } from "@/api/dto/requestDto";

export function useProjectDetail(projectId: string) {
  const { data, isLoading, isError, refetch } = useGetProject(projectId);
  const { mutateAsync: deleteModel } = useDeleteModel(projectId);
  const { mutateAsync: createPaymentItem, isPending: isCreatingPaymentItem } =
    useCreatePaymentItem(projectId);

  const project = data ?? null;
  const [openInvite, setOpenInvite] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [openAddItem, setOpenAddItem] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [modelThumbs] = useState<Record<string, string>>(() =>
    loadProjectThumbs(),
  );

  useEffect(() => {
    if (!data) return;
    updateProjects((projects) => {
      const exists = projects.some((item) => item.id === data.id);
      if (!exists) return [...projects, data];
      return projects.map((item) => (item.id === data.id ? data : item));
    });
  }, [data]);

  const handleDeleteModel = useCallback(
    async (modelId: string) => {
      await deleteModel(modelId);
    },
    [deleteModel],
  );

  const handleAddPaymentItem = useCallback(
    async (data: CreatePaymentItemRequestDto) => {
      await createPaymentItem(data);
      setOpenAddItem(false);
    },
    [createPaymentItem],
  );

  return {
    activeItem,
    handleAddPaymentItem,
    handleDeleteModel,
    isCreatingPaymentItem,
    isError,
    isLoading,
    modelThumbs,
    openAddItem,
    openInvite,
    openUpload,
    project,
    refetch,
    setActiveItem,
    setOpenAddItem,
    setOpenInvite,
    setOpenUpload,
  };
}
