import { createFileRoute, redirect } from "@tanstack/react-router";
import RegisterPage from "@/pages/RegisterPage";

export const Route = createFileRoute("/register")({
  beforeLoad: ({ context }) => {
    const auth = context.auth;
    if (!auth.isLoading && auth.isAuthenticated) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: RegisterPage,
});
