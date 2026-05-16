import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "@/lib/router";
import { useAuth } from "@/hooks/auth/useAuth";
import { tanstackQueryClient } from "@/api/clients/tanstackQueryClient";
import { AuthSessionInvalidationListener } from "@/hooks/auth/AuthErrorListener";
import { ErrorBoundary } from "@/components/error-boundary";

const AdminaUI = () => {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
};

export const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={tanstackQueryClient}>
        <AuthSessionInvalidationListener />
        <AdminaUI />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
