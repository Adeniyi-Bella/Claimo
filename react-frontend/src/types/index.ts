import type { ReactNode } from "react";

export type FooterLink = { label: string; to: string };
export type FooterColumn = { heading: string; links: FooterLink[] };

export type FeatureProps = {
  eyebrow?: string;
  title: string;
  lead?: string;
  children: ReactNode;
};

export type CreateProjectData = {
  name: string;
  description: string;
  location: string;
  startDate: string;
};

export type CreateProjectDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (data: CreateProjectData) => Promise<void> | void;
  isSubmitting?: boolean;
};

export function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}