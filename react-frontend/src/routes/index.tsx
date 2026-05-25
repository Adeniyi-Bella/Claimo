import HomePage from "@/pages/HomePage";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    const auth = context.auth;
    if (!auth.isLoading && auth.isAuthenticated) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: HomePage,
});
