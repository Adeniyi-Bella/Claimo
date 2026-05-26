import { createFileRoute } from "@tanstack/react-router";
import { FEATURES } from "@/types/constants";
import { HeroSection } from "@/components/HeroSection";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Claimo" },
      {
        name: "description",
        content:
          "Everything Claimo gives construction teams: BIM-linked payment items, partial claims, approval workflow, audit trail and more.",
      },
      { property: "og:title", content: "Features — Claimo" },
      {
        property: "og:description",
        content:
          "Every Claimo feature, from BIM-linked payment items to a full audit trail.",
      },
    ],
  }),
  component: FeaturesPage,
});

function FeaturesPage() {
  return (
    <HeroSection
      eyebrow="Features"
      title="Built for the way construction actually gets paid."
      lead="Claimo turns the messy paper-trail of payment certificates into a single, model-linked workflow that contractors, admins and clients all trust."
    >
      <div className="grid md:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border">
        {FEATURES.map((f) => (
          <div key={f.title} className="bg-surface p-6">
            <div className="font-medium">{f.title}</div>
            <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {f.body}
            </div>
          </div>
        ))}
      </div>
    </HeroSection>
  );
}
