import { useCallback, useMemo, useState } from "react";

import { usePaymentStore } from "@/hooks/usePaymentStore";
import { deleteModelFile } from "@/lib/model-storage";
import type { Member, PaymentItem, ProjectModel } from "@/lib/mock-data";
import {
  addProjectMember,
  addProjectModel,
  addProjectPaymentItem,
  loadProjectThumbs,
  removeProjectMember,
  removeProjectModel,
  saveProjectThumbs,
  useProjectList,
} from "@/lib/project-storage";

export function useProjectDetail(projectId: string) {
  const { projects, refreshProjects } = useProjectList();
  const syncFromSession = usePaymentStore((s) => s.syncFromSession);

  const [openInvite, setOpenInvite] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [openAddItem, setOpenAddItem] = useState(false);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [modelThumbs, setModelThumbs] = useState<Record<string, string>>(
    () => loadProjectThumbs(),
  );

  const project = useMemo(
    () => projects.find((item) => item.id === projectId) ?? null,
    [projectId, projects],
  );

  const handleInvite = useCallback(
    (member: Member) => {
      addProjectMember(projectId, member);
      refreshProjects();
      syncFromSession();
    },
    [projectId, refreshProjects, syncFromSession],
  );

  const handleRemoveMember = useCallback(
    (memberId: string) => {
      removeProjectMember(projectId, memberId);
      refreshProjects();
      syncFromSession();
    },
    [projectId, refreshProjects, syncFromSession],
  );

  const handleUploadModel = useCallback(
    (model: ProjectModel, thumb: string) => {
      addProjectModel(projectId, model);
      refreshProjects();
      setModelThumbs((current) => {
        const next = { ...current, [model.id]: thumb };
        saveProjectThumbs(next);
        return next;
      });
      syncFromSession();
    },
    [projectId, refreshProjects, syncFromSession],
  );

  const handleDeleteModel = useCallback(
    (modelId: string) => {
      void deleteModelFile(modelId);
      removeProjectModel(projectId, modelId);
      refreshProjects();
      syncFromSession();
    },
    [projectId, refreshProjects, syncFromSession],
  );

  const handleAddPaymentItem = useCallback(
    (item: PaymentItem) => {
      addProjectPaymentItem(projectId, item);
      refreshProjects();
      syncFromSession();
    },
    [projectId, refreshProjects, syncFromSession],
  );

  return {
    activeItem,
    handleAddPaymentItem,
    handleDeleteModel,
    handleInvite,
    handleRemoveMember,
    handleUploadModel,
    modelThumbs,
    openAddItem,
    openInvite,
    openUpload,
    project,
    setActiveItem,
    setOpenAddItem,
    setOpenInvite,
    setOpenUpload,
  };
}
