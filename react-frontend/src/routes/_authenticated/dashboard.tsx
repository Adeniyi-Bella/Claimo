import { createFileRoute } from "@tanstack/react-router";
import DashboardPage from "@/pages/DashboardPage";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Claimo" }] }),
  component: DashboardPage,
});
