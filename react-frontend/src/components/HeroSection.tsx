import type { FeatureProps } from "@/types";
import { Footer } from "./Footer/Footer";
import { Header } from "./Header/Header";
import type { ReactNode } from "react";

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

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="prose prose-neutral max-w-none text-foreground [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-muted-foreground [&_li]:my-1">
      {children}
    </div>
  );
}