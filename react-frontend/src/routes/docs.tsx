import { HeroSection } from "@/components/HeroSection";
import { DOC_SECTIONS } from "@/types/constants";
import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Docs — Claimo" },
      {
        name: "description",
        content:
          "Documentation for Claimo: getting started, payment claims, BIM viewer, account and billing.",
      },
      { property: "og:title", content: "Docs — Claimo" },
      {
        property: "og:description",
        content: "Everything you need to get the most out of Claimo.",
      },
    ],
  }),
  component: DocsPage,
});

function DocsPage() {
  return (
    <HeroSection
      eyebrow="Documentation"
      title="Everything you need to run Claimo."
      lead="Step-by-step guides for admins, contractors and clients. Start with the basics or jump straight into the topic you need."
    >
      <div className="space-y-12">
        {DOC_SECTIONS.map((s) => (
          <section key={s.heading}>
            <h2 className="text-2xl font-semibold tracking-tight">
              {s.heading}
            </h2>
            <div className="mt-5 grid md:grid-cols-3 gap-4">
              {s.articles.map((a) => (
                <div
                  key={a.title}
                  className="rounded-xl border border-border bg-surface p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-md bg-accent text-primary inline-flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{a.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {a.body}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </HeroSection>
  );
}
