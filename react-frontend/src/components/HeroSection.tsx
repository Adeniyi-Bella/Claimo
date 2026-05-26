import type { FeatureProps } from "@/types";
import { Footer } from "./Footer/Footer";
import { Header } from "./Header/Header";

export function HeroSection({
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