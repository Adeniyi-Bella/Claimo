import { useAuth as useClerkAuth, useUser } from "@clerk/react";

export const useAuth = () => {
  const { isLoaded, isSignedIn, userId, sessionId, orgId, orgRole } = useClerkAuth();
  const { user } = useUser();

  return {
    isLoaded,
    isAuthenticated: isLoaded && !!isSignedIn,
    isLoading: !isLoaded,
    userId,
    sessionId,
    orgId,
    orgRole,
    user,
  };
};

export type AuthContext = ReturnType<typeof useAuth>;
