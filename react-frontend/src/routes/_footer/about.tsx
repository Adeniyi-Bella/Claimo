import { HeroSection } from "@/components/HeroSection";
import { ABOUT_TIMELINE, ABOUT_VALUES } from "@/types/constants";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_footer/about")({
  head: () => ({
    meta: [
      { title: "About — Claimo" },
      { name: "description", content: "Claimo is on a mission to bring construction payment claims out of spreadsheets and onto the model." },
      { property: "og:title", content: "About — Claimo" },
      { property: "og:description", content: "Who we are and why we built Claimo." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <HeroSection
      eyebrow="About"
      title="Bringing claims out of spreadsheets and onto the model."
      lead="Claimo was started by quantity surveyors and BIM specialists who spent a decade watching the same problem repeat on every project: the people approving a payment had no easy way to see what they were paying for."
    >
      <h2 className="text-2xl font-semibold tracking-tight">What we believe</h2>
      <div className="mt-6 grid md:grid-cols-3 gap-6">
        {ABOUT_VALUES.map((v) => (
          <div key={v.title} className="rounded-xl border border-border bg-surface p-6">
            <div className="font-medium">{v.title}</div>
            <div className="mt-2 text-sm text-muted-foreground leading-relaxed">{v.body}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-16 text-2xl font-semibold tracking-tight">Our story</h2>
      <ol className="mt-6 relative border-l border-border space-y-8 pl-6">
        {ABOUT_TIMELINE.map((t) => (
          <li key={t.year} className="relative">
            <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
            <div className="text-xs text-primary font-mono">{t.year}</div>
            <div className="mt-1 font-medium">{t.title}</div>
            <div className="mt-1 text-sm text-muted-foreground leading-relaxed">{t.body}</div>
          </li>
        ))}
      </ol>
    </HeroSection>
  );
}
