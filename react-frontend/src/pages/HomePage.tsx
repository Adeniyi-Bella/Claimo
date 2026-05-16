import {
  ArrowRight,
  Boxes,
  Check,
  FileCheck2,
  LayoutDashboard,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ClaimoMark } from "@/components/common/claimo-mark";
import { StatusBadge } from "@/components/common/status-badge";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-7xl flex h-14 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <ClaimoMark className="h-7 w-7" />
            <span className="font-semibold tracking-tight">Claimo</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition">
              Features
            </a>
            <a href="#how" className="hover:text-foreground transition">
              How it works
            </a>
            <a href="#pricing" className="hover:text-foreground transition">
              Pricing
            </a>
            <a href="#" className="hover:text-foreground transition">
              Docs
            </a>
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40 mask-[radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground shadow-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-status-approved-fg" />
            New — Floor plan navigator and section cuts in the BIM viewer
          </div>
          <h1 className="mt-6 text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl mx-auto">
            Submit, track and approve{" "}
            <span className="text-gradient-primary">
              construction payment claims
            </span>{" "}
            in one place.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Claimo links every claim to the part of the BIM model it represents
            — so contractors, project admins and clients see the same source of
            truth.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/register"
              className="h-10 px-5 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition shadow-glow"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="h-10 px-5 inline-flex items-center rounded-md border border-border bg-surface font-medium hover:bg-accent transition"
            >
              Sign in
            </Link>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            No credit card. Free viewer tier forever.
          </div>

          {/* Hero mock */}
          <div className="mt-16 mx-auto max-w-5xl rounded-xl border border-border bg-surface shadow-elevated overflow-hidden">
            <div className="flex items-center gap-1.5 border-b border-border px-3 py-2 bg-surface-elevated">
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <span className="ml-3 text-xs text-muted-foreground">
                claimo.app / harbor-tower
              </span>
            </div>
            <div className="grid grid-cols-12 min-h-[360px]">
              <div className="col-span-8 relative bg-[oklch(0.96_0.01_250)] bg-dots">
                <div className="absolute inset-6 rounded-lg border border-border bg-linear-to-br from-[oklch(0.93_0.02_250)] to-[oklch(0.85_0.04_250)] flex items-center justify-center">
                  <BimSketch />
                </div>
                <div className="absolute top-3 left-3 flex gap-1">
                  {["Orbit", "Pan", "Section", "Measure"].map((t) => (
                    <span
                      key={t}
                      className="rounded-md bg-surface/90 backdrop-blur border border-border px-2 py-1 text-[11px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="col-span-4 border-l border-border p-4 text-left">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Payment items
                </div>
                <div className="mt-3 space-y-2">
                  {[
                    { c: "Concrete Works", v: "€312,500", s: "APPROVED" },
                    { c: "Reinforcement", v: "€88,200", s: "SUBMITTED" },
                    { c: "Plumbing", v: "€78,600", s: "REJECTED" },
                    { c: "HVAC", v: "€168,000", s: "NOT_STARTED" },
                  ].map((i) => (
                    <div
                      key={i.c}
                      className="rounded-md border border-border bg-surface p-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-medium">{i.c}</div>
                        <div className="text-xs text-muted-foreground">
                          {i.v}
                        </div>
                      </div>
                      <div className="mt-2">
                        <StatusBadge status={i.s as any} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-t border-border bg-surface-elevated/40"
      >
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-wider text-primary font-semibold">
              Everything in one workspace
            </div>
            <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
              A claim platform that lives next to the model.
            </h2>
          </div>
          <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
            {[
              {
                Icon: LayoutDashboard,
                title: "Project Management",
                body: "Companies, projects, members and roles — without the spreadsheets.",
              },
              {
                Icon: Boxes,
                title: "BIM Model Viewer",
                body: "Drop in IFC files. Orbit, section, measure and inspect properties.",
              },
              {
                Icon: FileCheck2,
                title: "Payment Tracking",
                body: "Per-category line items linked to model elements with live totals.",
              },
              {
                Icon: Workflow,
                title: "Approval Workflow",
                body: "Submit → Review → Approve or Reject — with a full audit trail.",
              },
            ].map((f) => (
              <div key={f.title} className="bg-surface p-6">
                <div className="h-9 w-9 rounded-md bg-accent text-primary inline-flex items-center justify-center mb-4">
                  <f.Icon className="h-4.5 w-4.5" />
                </div>
                <div className="font-medium">{f.title}</div>
                <div className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {f.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-wider text-primary font-semibold">
              How it works
            </div>
            <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
              From kickoff to final certificate.
            </h2>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              {
                n: "01",
                t: "Create a project",
                b: "Spin up a project, invite admins, contractors and viewers with the right permissions.",
              },
              {
                n: "02",
                t: "Upload your BIM model",
                b: "Bring in IFC files. Claimo handles versioning, navigation and floor plan extraction.",
              },
              {
                n: "03",
                t: "Track every payment",
                b: "Contractors submit, admins approve or reject — every change logged forever.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-xl border border-border bg-surface p-6 shadow-soft"
              >
                <div className="text-xs font-mono text-primary">{s.n}</div>
                <div className="mt-3 text-lg font-medium">{s.t}</div>
                <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {s.b}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="border-t border-border bg-surface-elevated/40"
      >
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <div className="text-xs uppercase tracking-wider text-primary font-semibold">
            Pricing
          </div>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
            Free to view. Scale when you submit.
          </h2>
          <div className="mt-12 grid md:grid-cols-2 gap-6 text-left">
            {[
              {
                name: "Viewer",
                price: "Free",
                desc: "For clients and observers who only need read-only access.",
                features: [
                  "Unlimited projects (view only)",
                  "BIM viewer & floor plans",
                  "Notifications",
                  "Audit trail visibility",
                ],
                cta: "Create account",
                highlight: false,
              },
              {
                name: "Build",
                price: "€29",
                suffix: "/ user / month",
                desc: "For contractors and admins running active claims.",
                features: [
                  "Submit, approve, reject claims",
                  "Unlimited models & items",
                  "Roles & per-project permissions",
                  "Export & integrations (soon)",
                ],
                cta: "Start 14-day trial",
                highlight: true,
              },
            ].map((p) => (
              <div
                key={p.name}
                className={`rounded-xl border p-7 bg-surface ${p.highlight ? "border-primary/30 shadow-glow" : "border-border shadow-soft"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{p.name}</div>
                  {p.highlight && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full bg-primary/10 text-primary px-2 py-0.5">
                      Most popular
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">
                    {p.price}
                  </span>
                  {p.suffix && (
                    <span className="text-sm text-muted-foreground">
                      {p.suffix}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {p.desc}
                </div>
                <ul className="mt-5 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`mt-7 inline-flex w-full justify-center items-center rounded-md h-10 text-sm font-medium transition ${p.highlight ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border bg-surface hover:bg-accent"}`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> SOC 2-ready · GDPR compliant
            · EU data residency
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Bring every claim back to the model.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Get your team running in under five minutes.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link
              to="/register"
              className="h-10 px-5 inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 shadow-glow"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/dashboard"
              className="h-10 px-5 inline-flex items-center rounded-md border border-border bg-surface font-medium hover:bg-accent"
            >
              Open demo dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface-elevated/30">
        <div className="mx-auto max-w-7xl px-6 py-12 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="flex items-center gap-2">
              <ClaimoMark className="h-6 w-6" />
              <span className="font-semibold">Claimo</span>
            </div>
            <div className="mt-3 text-muted-foreground">
              Construction payment claims, in one place.
            </div>
          </div>
          {[
            {
              h: "Product",
              l: ["Features", "BIM viewer", "Pricing", "Changelog"],
            },
            { h: "Company", l: ["About", "Customers", "Careers", "Contact"] },
            {
              h: "Resources",
              l: ["Docs", "Help center", "Status", "Security"],
            },
          ].map((c) => (
            <div key={c.h}>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {c.h}
              </div>
              <ul className="mt-3 space-y-2">
                {c.l.map((x) => (
                  <li key={x}>
                    <a
                      href="#"
                      className="text-muted-foreground hover:text-foreground transition"
                    >
                      {x}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border">
          <div className="mx-auto max-w-7xl px-6 py-5 flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
            <div>© {new Date().getFullYear()} Claimo Technologies B.V.</div>
            <div className="flex gap-5">
              <a href="#" className="hover:text-foreground">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground">
                Terms
              </a>
              <a href="#" className="hover:text-foreground">
                DPA
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BimSketch() {
  return (
    <svg viewBox="0 0 400 240" className="w-full h-full max-w-md">
      <defs>
        <linearGradient id="face1" x1="0" x2="1">
          <stop stopColor="oklch(0.78 0.04 250)" />
          <stop offset="1" stopColor="oklch(0.65 0.06 250)" />
        </linearGradient>
        <linearGradient id="face2" x1="0" x2="1">
          <stop stopColor="oklch(0.7 0.05 250)" />
          <stop offset="1" stopColor="oklch(0.55 0.07 250)" />
        </linearGradient>
        <linearGradient id="face3" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="oklch(0.85 0.03 250)" />
          <stop offset="1" stopColor="oklch(0.72 0.04 250)" />
        </linearGradient>
      </defs>
      {/* Building isometric */}
      <g stroke="oklch(0.32 0.08 255 / 0.5)" strokeWidth="0.6">
        <polygon points="120,80 240,40 320,80 200,120" fill="url(#face3)" />
        <polygon points="120,80 200,120 200,210 120,170" fill="url(#face1)" />
        <polygon points="200,120 320,80 320,170 200,210" fill="url(#face2)" />
        {/* windows */}
        {Array.from({ length: 6 }).map((_, r) =>
          Array.from({ length: 4 }).map((_, c) => (
            <rect
              key={`l-${r}-${c}`}
              x={130 + c * 16}
              y={95 + r * 17}
              width="10"
              height="10"
              fill="oklch(0.55 0.13 255 / 0.6)"
            />
          )),
        )}
        {Array.from({ length: 6 }).map((_, r) =>
          Array.from({ length: 6 }).map((_, c) => (
            <rect
              key={`r-${r}-${c}`}
              x={210 + c * 17}
              y={95 + r * 17}
              width="11"
              height="10"
              fill="oklch(0.42 0.13 255 / 0.7)"
            />
          )),
        )}
      </g>
      {/* Pin */}
      <g>
        <circle
          cx="265"
          cy="135"
          r="14"
          fill="oklch(0.42 0.13 255)"
          opacity="0.2"
        />
        <circle
          cx="265"
          cy="135"
          r="6"
          fill="oklch(0.42 0.13 255)"
          stroke="white"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
}
