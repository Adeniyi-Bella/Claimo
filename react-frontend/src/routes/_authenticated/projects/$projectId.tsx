import { createFileRoute } from "@tanstack/react-router";
import ProjectDetailPage from "@/pages/projects/ProjectDetailPage";
import { getProjectById } from "@/lib/project-storage";

export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  head: ({ params }) => {
    const project = getProjectById(params.projectId);
    return { meta: [{ title: `${project?.name ?? "Project"} — Claimo` }] };
  },
  component: ProjectDetailPage,
})
