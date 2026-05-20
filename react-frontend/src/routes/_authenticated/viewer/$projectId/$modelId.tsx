import ModelViewer from "@/pages/viewer/ModelViewer";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_authenticated/viewer/$projectId/$modelId",
)({
  head: () => ({ meta: [{ title: "3D Viewer — Claimo" }] }),
  component: ModelViewer,
});
