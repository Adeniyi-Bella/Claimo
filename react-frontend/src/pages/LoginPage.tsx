import { ClaimoMark } from "@/components/common/claimo-mark";
import { Link } from "@tanstack/react-router";
import { SignIn } from "@clerk/react";

export default function Login() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your Claimo workspace.">
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/register"
        forceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/dashboard"
      />

      <div className="mt-6 text-center text-sm text-muted-foreground">
        New to Claimo? <Link to="/register" className="text-primary font-medium hover:underline">Create an account</Link>
      </div>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2 mb-10">
            <ClaimoMark className="h-7 w-7" />
            <span className="font-semibold">Claimo</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="hidden lg:block relative bg-surface-elevated border-l border-border overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="relative h-full flex items-center justify-center p-12">
          <figure className="max-w-md">
            <blockquote className="text-2xl font-medium leading-snug tracking-tight">
              “Claimo cut the time we spend reconciling claims by 70%. Every payment now points back to a real model element.”
            </blockquote>
            <figcaption className="mt-6 text-sm text-muted-foreground">
              <div className="font-medium text-foreground">Sofia van Dijk</div>
              Director of Operations, Northpeak Build Group
            </figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
