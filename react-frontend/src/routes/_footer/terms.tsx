import { HeroSection, Prose } from "@/components/HeroSection";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_footer/terms")({
  head: () => ({
    meta: [
      { title: "Terms of service — Claimo" },
      { name: "description", content: "The terms under which Claimo provides its service." },
      { property: "og:title", content: "Terms of service — Claimo" },
      { property: "og:description", content: "Our terms of service." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <HeroSection
      eyebrow="Legal"
      title="Terms of service"
      lead="Last updated 1 May 2026. These terms govern your use of the Claimo platform. By creating an account, you agree to them."
    >
      <Prose>
        <h2>1. Service</h2>
        <p>
          Claimo provides a hosted construction payment-claims platform. We grant you a
          non-exclusive, non-transferable right to use the service for your internal business
          purposes, subject to these terms.
        </p>

        <h2>2. Accounts</h2>
        <p>
          You are responsible for safeguarding your account credentials and for all activity that
          occurs under your account. Notify us promptly of any unauthorised access.
        </p>

        <h2>3. Your content</h2>
        <p>
          You retain all rights to the projects, models, claims and other content you upload ("Your
          Content"). You grant Claimo a limited licence to host, process and display Your Content
          solely to provide the service.
        </p>

        <h2>4. Acceptable use</h2>
        <ul>
          <li>No unlawful, infringing or harmful content.</li>
          <li>No reverse-engineering, scraping or circumventing technical limits.</li>
          <li>No use that interferes with the integrity or performance of the service.</li>
        </ul>

        <h2>5. Fees & taxes</h2>
        <p>
          Paid plans are billed in advance, in euros, exclusive of VAT. Fees are non-refundable
          except where required by law. You can cancel renewals at any time from your billing
          settings.
        </p>

        <h2>6. Termination</h2>
        <p>
          Either party may terminate for material breach not cured within 30 days of notice. On
          termination you may export Your Content for 30 days, after which it will be deleted.
        </p>

        <h2>7. Warranties & liability</h2>
        <p>
          The service is provided "as is". To the maximum extent permitted by law, Claimo's
          aggregate liability arising out of or related to these terms is limited to the fees paid
          by you in the twelve months preceding the claim.
        </p>

        <h2>8. Governing law</h2>
        <p>
          These terms are governed by the laws of the Netherlands. Any dispute will be resolved by
          the competent courts of Rotterdam.
        </p>
      </Prose>
    </HeroSection>
  );
}
