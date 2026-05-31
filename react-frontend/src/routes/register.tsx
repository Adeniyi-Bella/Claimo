import { createFileRoute, redirect } from "@tanstack/react-router";
import RegisterPage from "@/pages/RegisterPage";

export const Route = createFileRoute("/register")({
  beforeLoad: ({ context, location }) => {
    const auth = context.auth;
    const hasTicket = new URLSearchParams(location.search).has("__clerk_ticket");
    
    if (!auth.isLoading && auth.isAuthenticated && !hasTicket) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: RegisterPage,
});
