import { useState } from "react";
import { SignIn, SignUp } from "@clerk/react";
import { Link } from "@tanstack/react-router";
import { Input } from "@/components/common/input";
import { AuthShell } from "@/pages/LoginPage";

export default function RegisterPage() {
  const clerkStatus =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("__clerk_status")
      : null;
  const isInviteSignIn = clerkStatus === "sign_in";
  const [companyName, setCompanyName] = useState("");

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
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-background/80 p-4 shadow-sm">
            <label htmlFor="company-name" className="text-sm font-medium">
              Company name
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              This becomes the workspace name for your first company in Claimo.
            </p>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Northpeak Build Group"
              className="mt-3"
              autoComplete="organization"
            />
          </div>
          <SignUp
            routing="path"
            path="/register"
            signInUrl="/login"
            signInForceRedirectUrl="/dashboard"
            forceRedirectUrl="/dashboard"
            unsafeMetadata={{
              company_name: companyName.trim(),
            }}
          />
        </div>
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
