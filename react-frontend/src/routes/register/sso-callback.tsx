import { AuthenticateWithRedirectCallback } from "@clerk/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/register/sso-callback")({
  component: () => <AuthenticateWithRedirectCallback />,
});
