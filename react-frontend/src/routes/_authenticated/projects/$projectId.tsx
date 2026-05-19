import { createFileRoute } from "@tanstack/react-router";
import ProjectDetailPage from "@/pages/projects/ProjectDetailPage";
import type { Project } from "@/lib/mock-data";

export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  head: ({ params }) => {
    try {
      const raw = sessionStorage.getItem("claimo:projects");
      const projects: Project[] = raw ? JSON.parse(raw) : [];
      const p = projects.find(x => x.id === params.projectId);
      return { meta: [{ title: `${p?.name ?? "Project"} — Claimo` }] };
    } catch {
      return { meta: [{ title: "Project — Claimo" }] };
    }
  },
  component: ProjectDetailPage,
})
