import { createFileRoute } from "@tanstack/react-router";
import ProjectDetailPage from "@/pages/projects/ProjectDetailPage";

export const Route = createFileRoute('/_authenticated/projects/$projectId')({
  head: () => ({ meta: [{ title: "Project — Claimo" }] }),
  component: ProjectDetailPage,
})
