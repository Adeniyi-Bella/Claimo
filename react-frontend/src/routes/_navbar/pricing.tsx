import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { HeroSection } from "@/components/HeroSection";
import { PRICING_PLANS, PRICING_FAQ } from "@/types/constants";

export const Route = createFileRoute("/_navbar/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Claimo" },
      {
        name: "description",
        content:
          "Free for viewers. €29 per user per month for contractors and admins.",
      },
      { property: "og:title", content: "Pricing — Claimo" },
      {
        property: "og:description",
        content:
          "Simple pricing for construction teams. Free viewer tier, €29 per user for full access.",
      },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <HeroSection
      eyebrow="Pricing"
      title="Free to view. Scale when you submit."
      lead="Pay only for the people who actually submit, approve or reject claims. Everyone else — clients, observers, auditors — is free, forever."
    >
      <div className="grid md:grid-cols-2 gap-10">
        {PRICING_PLANS.map((p) => (
          <div
            key={p.name}
            className={`rounded-xl border p-7 bg-surface flex flex-col ${
              p.highlight
                ? "border-primary/30 shadow-glow"
                : "border-border shadow-soft"
            }`}
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
              {p.description}
            </div>
            <ul className="mt-5 space-y-2 text-sm flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className={`mt-7 inline-flex w-full justify-center items-center rounded-md h-10 text-sm font-medium transition ${
                p.highlight
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border border-border bg-surface hover:bg-accent"
              }`}
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </div>

      <h2 className="mt-16 text-2xl font-semibold tracking-tight">
        Frequently asked
      </h2>
      <div className="mt-6 divide-y divide-border rounded-xl border border-border bg-surface">
        {PRICING_FAQ.map((f) => (
          <div key={f.q} className="p-5">
            <div className="font-medium">{f.q}</div>
            <div className="mt-1 text-sm text-muted-foreground">{f.a}</div>
          </div>
        ))}
      </div>
    </HeroSection>
  );
}
