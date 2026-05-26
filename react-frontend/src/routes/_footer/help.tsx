import { createFileRoute, Link } from "@tanstack/react-router";
import { HeroSection } from "@/components/HeroSection";
import { HELP_CATEGORIES } from "@/types/constants";

export const Route = createFileRoute("/_footer/help")({
  head: () => ({
    meta: [
      { title: "Help center — Claimo" },
      {
        name: "description",
        content:
          "Answers to common questions about accounts, billing, projects, claims and the BIM viewer.",
      },
      { property: "og:title", content: "Help center — Claimo" },
      {
        property: "og:description",
        content: "Find an answer or get in touch with support.",
      },
    ],
  }),
  component: HelpPage,
});

function HelpPage() {
  return (
    <HeroSection
      eyebrow="Help center"
      title="How can we help?"
      lead="Browse the most common questions by category. If you can't find what you need, our support team replies within one business day."
    >
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {HELP_CATEGORIES.map((c) => (
          <div
            key={c.title}
            className="rounded-xl border border-border bg-surface p-6"
          >
            <div className="font-medium">{c.title}</div>
            <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {c.body}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 rounded-xl border border-border bg-surface p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-medium">Still stuck?</div>
          <div className="text-sm text-muted-foreground">
            Reach our support team — we reply within one business day.
          </div>
        </div>
        <Link
          to="/contact"
          className="h-10 px-5 inline-flex items-center rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90"
        >
          Contact support
        </Link>
      </div>
    </HeroSection>
  );
}
