import { createFileRoute } from "@tanstack/react-router";
import ModelViewer from "@/lib/viewer/ModelViewer";

export const Route = createFileRoute(
  "/_authenticated/viewer/$projectId/$modelId",
)({
  head: () => ({ meta: [{ title: "3D Viewer — Claimo" }] }),
  component: ModelViewer,
});
