import { createFileRoute } from "@tanstack/react-router";
import { FEATURES } from "@/types/constants";
import { Header } from "@/components/Header/Header";
import { Footer } from "@/components/Footer/Footer";
import type { FeatureProps } from "@/types";

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
    <MarketingPage
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
    </MarketingPage>
  );
}

export function MarketingPage({
  eyebrow,
  title,
  lead,
  children,
}: FeatureProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="border-b border-border bg-surface-elevated/40">
          <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
            {eyebrow && (
              <div className="text-xs uppercase tracking-wider text-primary font-semibold">
                {eyebrow}
              </div>
            )}
            <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
              {title}
            </h1>
            {lead && (
              <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
                {lead}
              </p>
            )}
          </div>
        </section>
        <div className="mx-auto max-w-5xl px-6 py-14 md:py-16">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
