import { HeroSection, Prose } from "@/components/HeroSection";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_footer/dpa")({
  head: () => ({
    meta: [
      { title: "Data processing addendum — Claimo" },
      {
        name: "description",
        content:
          "Claimo's GDPR-compliant data processing addendum for business customers.",
      },
      { property: "og:title", content: "Data processing addendum — Claimo" },
      { property: "og:description", content: "Our standard DPA." },
    ],
  }),
  component: DpaPage,
});

function DpaPage() {
  return (
    <HeroSection
      eyebrow="Legal"
      title="Data processing addendum"
      lead="This DPA forms part of the agreement between Claimo Technologies B.V. and the customer and reflects the parties' obligations under the GDPR."
    >
      <Prose>
        <h2>1. Roles</h2>
        <p>
          The customer is the controller and Claimo is the processor of personal
          data processed through the service. Each party will comply with its
          respective obligations under applicable data protection law.
        </p>

        <h2>2. Scope of processing</h2>
        <p>
          Claimo processes personal data only on the customer's documented
          instructions, for the purposes of providing the service set out in the
          agreement, and for the duration of the subscription plus the 30-day
          export window after termination.
        </p>

        <h2>3. Sub-processors</h2>
        <p>
          The customer authorises Claimo to engage the sub-processors listed in
          our security documentation. We will notify customers of any intended
          changes and give them the opportunity to object on reasonable grounds.
        </p>

        <h2>4. International transfers</h2>
        <p>
          Customer personal data is stored and processed within the European
          Economic Area. Where any transfer outside the EEA is required, it will
          be governed by the European Commission's Standard Contractual Clauses.
        </p>

        <h2>5. Security measures</h2>
        <ul>
          <li>Encryption in transit (TLS 1.3) and at rest (AES-256).</li>
          <li>Row-level security on every tenant table.</li>
          <li>Least-privilege internal access with full audit logging.</li>
          <li>Annual third-party penetration testing.</li>
        </ul>

        <h2>6. Personal data breaches</h2>
        <p>
          Claimo will notify the customer without undue delay, and in any event
          within 72 hours, of becoming aware of a personal data breach affecting
          customer data.
        </p>

        <h2>7. Data subject requests</h2>
        <p>
          Claimo will assist the customer, by appropriate technical and
          organisational measures, in responding to requests from data subjects
          exercising their rights under the GDPR.
        </p>

        <h2>8. Audit rights</h2>
        <p>
          Once per year, with reasonable notice, the customer may audit Claimo's
          compliance with this DPA. In most cases, our SOC 2 reports and
          security questionnaires will satisfy this requirement.
        </p>

        <h2>Signing the DPA</h2>
        <p>
          A countersigned PDF version is available on request — email{" "}
          <a href="mailto:legal@claimo.app">legal@claimo.app</a>.
        </p>
      </Prose>
    </HeroSection>
  );
}
