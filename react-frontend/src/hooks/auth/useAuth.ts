import { useAuth as useClerkAuth, useUser } from "@clerk/react";

export const useAuth = () => {
  const {
    isLoaded,
    isSignedIn,
    userId,
    sessionId,
    orgId,
    orgRole,
    getToken,
  } = useClerkAuth();
  const { user } = useUser();

  return {
    isLoaded,
    isAuthenticated: isLoaded && !!isSignedIn,
    isLoading: !isLoaded,
    userId,
    sessionId,
    orgId,
    orgRole,
    getToken,
    user,
  };
};

export type AuthContext = ReturnType<typeof useAuth>;
