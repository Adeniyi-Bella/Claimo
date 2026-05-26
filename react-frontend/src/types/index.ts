import type { ReactNode } from "react";

export type FooterLink = { label: string; to: string };
export type FooterColumn = { heading: string; links: FooterLink[] };

export type FeatureProps = {
  eyebrow?: string;
  title: string;
  lead?: string;
  children: ReactNode;
};