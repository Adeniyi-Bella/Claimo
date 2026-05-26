import { HeroSection } from "@/components/HeroSection";
import { CHANGELOG } from "@/types/constants";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_footer/changelog")({
  head: () => ({
    meta: [
      { title: "Changelog — Claimo" },
      {
        name: "description",
        content: "Everything we've shipped in Claimo, version by version.",
      },
      { property: "og:title", content: "Changelog — Claimo" },
      { property: "og:description", content: "What's new in Claimo." },
    ],
  }),
  component: ChangelogPage,
});

const TAG_COLORS: Record<string, string> = {
  New: "bg-primary/10 text-primary",
  Improved: "bg-status-approved/15 text-status-approved-fg",
  Fixed: "bg-muted text-muted-foreground",
};

function ChangelogPage() {
  return (
    <HeroSection
      eyebrow="Changelog"
      title="What's new in Claimo."
      lead="We ship every week. Major releases land here with the full list of additions, improvements and fixes."
    >
      <div className="space-y-10">
        {CHANGELOG.map((entry) => (
          <article
            key={entry.version}
            className="rounded-xl border border-border bg-surface p-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-lg font-semibold tracking-tight">
                v{entry.version}
              </div>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 ${TAG_COLORS[entry.tag] ?? "bg-muted text-muted-foreground"}`}
              >
                {entry.tag}
              </span>
              <div className="text-xs text-muted-foreground ml-auto">
                {entry.date}
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc pl-5">
              {entry.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </HeroSection>
  );
}
