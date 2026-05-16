import { useEffect, useRef } from "react";
import { tanstackQueryClient } from "@/api/clients/tanstackQueryClient";
import { AUTH_SESSION_INVALIDATE_EVENT } from "@/types/constants";
import { useClerk } from "@clerk/react";

export function AuthSessionInvalidationListener() {
  const { signOut } = useClerk();
  const handledRef = useRef(false);

  useEffect(() => {
    const handleAuthSession = () => {
      if (handledRef.current) return;
      handledRef.current = true;

      tanstackQueryClient.clear();

      void signOut({ redirectUrl: "/" }).catch(() => {
        window.location.assign("/");
      });
    };

    window.addEventListener(AUTH_SESSION_INVALIDATE_EVENT, handleAuthSession);
    return () => {
      window.removeEventListener(AUTH_SESSION_INVALIDATE_EVENT, handleAuthSession);
    };
  }, [signOut]);

  return null;
}
