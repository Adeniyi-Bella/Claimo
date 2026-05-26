import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ClaimoMark } from "@/components/common/claimo-mark";
import { headerLinks } from "./header-links";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto max-w-7xl flex h-14 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <ClaimoMark className="h-7 w-7" />
          <span className="font-semibold tracking-tight">Claimo</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          {headerLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="hover:text-foreground transition"
              activeProps={{ className: "text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="h-8 px-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="h-8 px-3.5 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition shadow-soft"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
