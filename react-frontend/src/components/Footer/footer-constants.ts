import type { FooterColumn, FooterLink } from "@/types";

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", to: "/features" },
      { label: "BIM viewer", to: "/bim-viewer" },
      { label: "Pricing", to: "/pricing" },
      { label: "Changelog", to: "/changelog" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Customers", to: "/customers" },
      { label: "Careers", to: "/careers" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Docs", to: "/docs" },
      { label: "Help center", to: "/help" },
      { label: "Status", to: "/status" },
      { label: "Security", to: "/security" },
    ],
  },
];

export const LEGAL_LINKS: FooterLink[] = [
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
  { label: "DPA", to: "/dpa" },
];