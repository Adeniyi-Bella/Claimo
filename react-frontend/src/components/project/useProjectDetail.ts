import { useCallback, useEffect, useState } from "react";

import { useGetProject } from "@/hooks/api/projects/useProject";
import {
  // getProjectById,
  loadProjectThumbs,
  updateProjects,
} from "@/lib/project-storage";
import type { ProjectResponse, PaymentItem } from "@/api/dto/responseDto";
import { useDeleteModel } from "@/hooks/api/models/useModel";

export function useProjectDetail(projectId: string) {
  const { data, isLoading, isError, refetch } = useGetProject(projectId);
  const { mutateAsync: deleteModel } = useDeleteModel(projectId);

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [openInvite, setOpenInvite] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [openAddItem, setOpenAddItem] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [modelThumbs] = useState<Record<string, string>>(() =>
    loadProjectThumbs(),
  );

  useEffect(() => {
    if (!data) return;
    console.log("Project loaded from server:", data.models.length, "models");
    setProject(data);
  }, [data]);

  useEffect(() => {
    if (!project) return;
    updateProjects((projects) => {
      const exists = projects.some((item) => item.id === project.id);
      if (!exists) {
        return [...projects, project];
      }
      return projects.map((item) => (item.id === project.id ? project : item));
    });
  }, [project]);

  const handleDeleteModel = useCallback(
    async (modelId: string) => {
      await deleteModel(modelId);
    },
    [deleteModel],
  );

  const handleAddPaymentItem = useCallback((item: PaymentItem) => {
    setProject((current) =>
      current
        ? {
            ...current,
            models: current.models.map((model) =>
              model.id === item.modelId
                ? { ...model, paymentItems: [...model.paymentItems, item] }
                : model,
            ),
          }
        : current,
    );
  }, []);

  return {
    activeItem,
    handleAddPaymentItem,
    handleDeleteModel,
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
