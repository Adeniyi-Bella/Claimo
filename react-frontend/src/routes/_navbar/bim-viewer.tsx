import { HeroSection } from "@/components/HeroSection";
import { BIM_CAPABILITIES } from "@/types/constants";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_navbar/bim-viewer")({
  head: () => ({
    meta: [
      { title: "BIM viewer — Claimo" },
      {
        name: "description",
        content:
          "An in-browser BIM viewer that links every model element to its payment items. IFC and BufferGeometry JSON supported.",
      },
      { property: "og:title", content: "BIM viewer — Claimo" },
      {
        property: "og:description",
        content:
          "A WebGL BIM viewer with section cuts, element inspection and live payment links.",
      },
    ],
  }),
  component: BimViewerPage,
});

function BimViewerPage() {
  return (
    <HeroSection
      eyebrow="BIM viewer"
      title="The model and the money on the same screen."
      lead="A WebGL viewer built specifically for payment review. Open IFC and Three.js geometry directly in the browser, then click any element to see the claims attached to it."
    >
      <div className="grid md:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border border-border">
        {BIM_CAPABILITIES.map((c) => (
          <div key={c.title} className="bg-surface p-6">
            <div className="font-medium">{c.title}</div>
            <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {c.body}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-12 rounded-xl border border-border bg-surface p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-medium">Try it on a real project</div>
          <div className="text-sm text-muted-foreground">
            Spin up a demo workspace — no credit card required.
          </div>
        </div>
        <Link
          to="/register"
          className="h-10 px-5 inline-flex items-center rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90"
        >
          Get started
        </Link>
      </div>
    </HeroSection>
  );
}
