import { useCallback, useEffect, useState } from "react";

import { useProject } from "@/hooks/api/projects/useProject";
import { deleteModelFile } from "@/lib/model-storage";
import {
  loadProjectThumbs,
  saveProjectThumbs,
  updateProjects,
} from "@/lib/project-storage";
import type { ProjectResponse, PaymentItem, ProjectModel } from "@/api/dto/responseDto";

export function useProjectDetail(projectId: string) {
  const { data, isLoading, isError, refetch } = useProject(projectId);

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [openInvite, setOpenInvite] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [openAddItem, setOpenAddItem] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [modelThumbs, setModelThumbs] = useState<Record<string, string>>(
    () => loadProjectThumbs(),
  );

  useEffect(() => {
    if (!data) return;
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

  // const handleInvite = useCallback((member: Member) => {
  //   setProject((current) =>
  //     current ? { ...current, members: [...current.members, member] } : current,
  //   );
  // }, []);

  // const handleRemoveMember = useCallback((memberId: string) => {
  //   setProject((current) =>
  //     current
  //       ? {
  //           ...current,
  //           members: current.members.filter((member) => member.id !== memberId),
  //         }
  //       : current,
  //   );
  // }, []);

  const handleUploadModel = useCallback((model: ProjectModel, thumb: string) => {
    setProject((current) =>
      current ? { ...current, models: [...current.models, model] } : current,
    );
    setModelThumbs((current) => {
      const next = { ...current, [model.id]: thumb };
      saveProjectThumbs(next);
      return next;
    });
  }, []);

  const handleDeleteModel = useCallback((modelId: string) => {
    void deleteModelFile(modelId);
    setProject((current) =>
      current
        ? {
            ...current,
            models: current.models.filter((model) => model.id !== modelId),
          }
        : current,
    );
  }, []);

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
    // handleInvite,
    // handleRemoveMember,
    handleUploadModel,
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
