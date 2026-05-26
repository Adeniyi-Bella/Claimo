import { createFileRoute } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { HeroSection } from "@/components/HeroSection";
import { CONTACT_CHANNELS, CONTACT_OFFICE } from "@/types/constants";

export const Route = createFileRoute("/_footer/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Claimo" },
      {
        name: "description",
        content:
          "Get in touch with Claimo — sales, support, security and press.",
      },
      { property: "og:title", content: "Contact — Claimo" },
      { property: "og:description", content: "How to reach the team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <HeroSection
      eyebrow="Contact"
      title="Talk to a human."
      lead="We answer every message ourselves. Pick the right channel below and we'll get back to you within one business day."
    >
      <div className="grid md:grid-cols-2 gap-6">
        {CONTACT_CHANNELS.map((c) => (
          <a
            key={c.email}
            href={`mailto:${c.email}`}
            className="rounded-xl border border-border bg-surface p-6 hover:bg-accent transition group"
          >
            <div className="font-medium">{c.title}</div>
            <div className="mt-1 text-sm text-muted-foreground">{c.body}</div>
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-primary group-hover:underline">
              <Mail className="h-3.5 w-3.5" />
              {c.email}
            </div>
          </a>
        ))}
      </div>

      <h2 className="mt-16 text-2xl font-semibold tracking-tight">Office</h2>
      <div className="mt-4 rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground space-y-1">
        <div className="font-medium text-foreground">
          {CONTACT_OFFICE.line1}
        </div>
        <div>{CONTACT_OFFICE.line2}</div>
        <div>{CONTACT_OFFICE.line3}</div>
        <div>{CONTACT_OFFICE.line4}</div>
        {/* <div className="pt-3 text-xs">
          VAT {CONTACT_OFFICE.vat} · KvK {CONTACT_OFFICE.kvk}
        </div> */}
      </div>
    </HeroSection>
  );
}
