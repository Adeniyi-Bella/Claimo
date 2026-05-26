import { HeroSection, Prose } from "@/components/HeroSection";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_footer/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy policy — Claimo" },
      { name: "description", content: "How Claimo collects, uses and protects your personal data." },
      { property: "og:title", content: "Privacy policy — Claimo" },
      { property: "og:description", content: "Our privacy policy in plain language." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <HeroSection
      eyebrow="Legal"
      title="Privacy policy"
      lead="Last updated 1 May 2026. This policy explains what personal data Claimo collects, why we collect it, and what rights you have under the GDPR."
    >
      <Prose>
        <h2>Who we are</h2>
        <p>
          Claimo Technologies B.V. ("Claimo", "we", "us") is the data controller for personal data
          processed through the Claimo website and application. We are registered in Rotterdam, the
          Netherlands.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li><strong>Account data:</strong> name, work email, company, role and password hash.</li>
          <li><strong>Project data:</strong> the projects, models, payment items and claims you upload.</li>
          <li><strong>Usage data:</strong> pages visited, features used, and basic device/browser metadata.</li>
          <li><strong>Billing data:</strong> processed by our payment processor; we never store full card numbers.</li>
        </ul>

        <h2>Why we collect it</h2>
        <p>
          We process data to deliver and improve the service, secure your account, comply with our
          legal obligations and — only with your consent — send you product updates.
        </p>

        <h2>How long we keep it</h2>
        <p>
          Project and account data is retained for the lifetime of your workspace and for 90 days
          after deletion to allow recovery. Billing records are kept for seven years to satisfy
          Dutch tax law.
        </p>

        <h2>Your rights</h2>
        <p>
          You can access, correct, export or delete your personal data at any time from your account
          settings, or by emailing <a href="mailto:privacy@claimo.app">privacy@claimo.app</a>. You
          also have the right to lodge a complaint with the Dutch Data Protection Authority
          (Autoriteit Persoonsgegevens).
        </p>

        <h2>Sub-processors</h2>
        <p>
          We use a small set of vetted EU-based sub-processors for hosting, email delivery and error
          monitoring. The current list is available on request.
        </p>

        <h2>Contact</h2>
        <p>
          For any privacy question, email{" "}
          <a href="mailto:privacy@claimo.app">privacy@claimo.app</a>.
        </p>
      </Prose>
    </HeroSection>
  );
}