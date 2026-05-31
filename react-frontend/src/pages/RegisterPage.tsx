import { SignIn, SignUp } from "@clerk/react";
import { Link } from "@tanstack/react-router";
import { AuthShell } from "@/pages/LoginPage";

export default function RegisterPage() {
  const clerkStatus =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("__clerk_status")
      : null;
  const isInviteSignIn = clerkStatus === "sign_in";

  return (
    <AuthShell
      title={isInviteSignIn ? "Sign in to accept your invitation" : "Create your account"}
      subtitle={
        isInviteSignIn
          ? "Your Claimo account already exists. Sign in to join it."
          : "Start your Claimo account."
      }
    >
      {isInviteSignIn ? (
        <SignIn
          routing="path"
          path="/register"
          signUpUrl="/register"
          forceRedirectUrl="/dashboard"
          signUpForceRedirectUrl="/dashboard"
        />
      ) : (
        <SignUp
          routing="path"
          path="/register"
          signInUrl="/login"
          signInForceRedirectUrl="/dashboard"
          forceRedirectUrl="/dashboard"
        />
      )}

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {isInviteSignIn ? (
          <>
            Need a different account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Create one
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}
