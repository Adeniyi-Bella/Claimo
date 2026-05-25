import { SignUp } from "@clerk/react";
import { Link } from "@tanstack/react-router";
import { AuthShell } from "@/pages/LoginPage";

export default function RegisterPage() {
  return (
    <AuthShell title="Create your account" subtitle="Start your Claimo workspace.">
      <SignUp
        routing="path"
        path="/register"
        signInUrl="/login"
        signInForceRedirectUrl="/dashboard"
        forceRedirectUrl="/dashboard"
      />

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </div>
    </AuthShell>
  );
}
