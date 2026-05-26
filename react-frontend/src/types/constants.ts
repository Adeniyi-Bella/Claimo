import { config } from "@/lib/config/config";

export const API_BASE_URL = config.VITE_API_URL;
export const API_TIMEOUT_MS = 15000;
export const AUTH_SESSION_INVALIDATE_EVENT = "admina:auth-error";

export const FEATURES = [
  {
    title: "Project workspaces",
    body: "Spin up a project in seconds, invite contractors, admins and clients, and give each member precisely the permissions they need.",
  },
  {
    title: "BIM model viewer",
    body: "Drop or upload IFC. Orbit, pan, section-cut and inspect properties — all in the browser, no plugin required.",
  },
  {
    title: "Payment items linked to elements",
    body: "Every payment line item is tied to the part of the model it represents, so reviewers always see what they are paying for.",
  },
  {
    title: "Partial & progressive claims",
    body: "Submit interim claims as work progresses. Approved-to-date and remaining contract value are recalculated automatically.",
  },
  {
    title: "Approval workflow",
    body: "Submit → review → approve or reject, with mandatory reasons on rejection and a permanent, exportable audit trail.",
  },
  {
    title: "Roles & permissions",
    body: "Contractor, Approver, Admin and Viewer — fine-grained per project. Clients get read-only access for free, forever.",
  },
  {
    title: "Real-time totals",
    body: "Approved, pending and remaining values update live across every tab and every device the moment a decision is made.",
  },
  {
    title: "Audit trail",
    body: "Every claim, decision, comment and model upload is timestamped and attributed. Export to CSV or PDF for your records.",
  },
];

export const BIM_CAPABILITIES = [
  { title: "IFC support", body: "Upload IFC files from Revit, ArchiCAD or Tekla, or drop in Three.js BufferGeometry JSON for lightweight visualisation." },
  { title: "Orbit, pan, zoom", body: "Smooth WebGL navigation with gizmo overlay and reset-to-fit on every load." },
  { title: "Section cuts", body: "Slice the model along any axis to inspect interior elements without leaving the viewer." },
  { title: "Element inspector", body: "Click any part of the model to see its linked payment items, status and approval history." },
//   { title: "Multi-tab sync", body: "Pop the viewer into its own tab — the model and selection stay in sync with the project tab via local storage events." },
//   { title: "Floor plan navigator", body: "Auto-extracted floor plans let you jump to a storey with a single click." },
];

export const PRICING_PLANS = [
  {
    name: "Viewer",
    price: "Free",
    suffix: "",
    description: "For clients and observers who only need read-only access.",
    features: [
      "Unlimited projects (view only)",
      "BIM viewer & floor plans",
      "Email notifications",
      "Audit trail visibility",
    ],
    cta: "Create account",
    highlight: false,
  },
  {
    name: "Build",
    price: "€29",
    suffix: "/ user / month",
    description: "For contractors and admins running active claims.",
    features: [
      "Submit, approve and reject claims",
      "Unlimited models & line items",
      "Roles & per-project permissions",
      "Export to CSV and PDF",
      "Email & in-app notifications",
    ],
    cta: "Start 14-day trial",
    highlight: true,
  },
//   {
//     name: "Enterprise",
//     price: "Custom",
//     suffix: "",
//     description: "For large contractors and developers with custom requirements.",
//     features: [
//       "SSO (SAML, Okta, Azure AD)",
//       "EU data residency & DPA",
//       "Custom roles & approval chains",
//       "Dedicated success manager",
//       "99.95% uptime SLA",
//     ],
//     cta: "Talk to sales",
//     highlight: false,
//   },
];

export const PRICING_FAQ = [
  { q: "How is a user counted?", a: "A user is any teammate who can submit, approve or reject claims. Read-only viewers are always free." },
  { q: "Is there a free trial?", a: "Yes — every Build workspace gets 14 days of full access. No credit card required." },
  // { q: "Do you offer annual billing?", a: "Yes, with a 15% discount when paid annually. Contact sales for enterprise terms." },
  { q: "Where is my data stored?", a: "All customer data is stored in the EU (Frankfurt, Germany) with daily encrypted backups." },
];

export const DOC_SECTIONS = [
  {
    heading: "Getting started",
    articles: [
      { title: "Create your first project", body: "Spin up a workspace, invite your team and configure roles." },
      { title: "Invite teammates", body: "Send role-based invitations and manage seats." },
      { title: "Upload a BIM model", body: "Supported formats, size limits and best practices." },
    ],
  },
  {
    heading: "Payment claims",
    articles: [
      { title: "Create a payment item", body: "Define contract value, link it to model elements and set the approver." },
      { title: "Submit a partial claim", body: "Claim against work in progress without locking the line item." },
      { title: "Approve or reject", body: "Decision rules, mandatory reasons and the audit trail." },
    ],
  },
  {
    heading: "BIM viewer",
    articles: [
      { title: "Supported file formats", body: "IFC 2x3, IFC 4 and Three.js BufferGeometry JSON." },
      { title: "Navigation & section cuts", body: "Orbit, pan, zoom and slice along any axis." },
      { title: "Multi-tab sync", body: "Pop the viewer out and keep it in sync with the project tab." },
    ],
  },
  // {
  //   heading: "Account & billing",
  //   articles: [
  //     { title: "Plans and seats", body: "How users, viewers and seats are counted." },
  //     { title: "Invoices and receipts", body: "Where to find them and how to update billing details." },
  //     { title: "Cancel or downgrade", body: "What happens to your data when you change plan." },
  //   ],
  // },
];

export const CHANGELOG = [
  {
    version: "1.8.0",
    date: "May 20, 2026",
    tag: "New",
    items: [
      "Floor plan navigator extracted from IFC storeys",
      "Section cuts along X / Y / Z axes in the viewer",
      "BufferGeometry JSON uploads supported alongside IFC",
    ],
  },
  {
    version: "1.7.2",
    date: "May 4, 2026",
    tag: "Fixed",
    items: [
      "Partial claims that bring approved-to-date to exactly the contract value now correctly mark items as Completed",
      "Resolved a race condition when two approvers acted on the same claim within the same second",
    ],
  },
  {
    version: "1.7.0",
    date: "April 18, 2026",
    tag: "New",
    items: [
      "Role switcher in payment item panel for demos and onboarding",
      "Sonner toast notifications for every claim action",
      "Stacked progress bar showing approved / pending / remaining at a glance",
    ],
  },
  {
    version: "1.6.0",
    date: "March 30, 2026",
    tag: "New",
    items: [
      "Rejection reasons are now mandatory and surfaced in the audit trail",
      "Per-project member roles (Admin, Approver, Contractor, Viewer)",
    ],
  },
  {
    version: "1.5.0",
    date: "March 2, 2026",
    tag: "Improved",
    items: [
      "Viewer load time reduced by 38% on models above 50 MB",
      "Dark mode polish across dashboard and project pages",
    ],
  },
];

export const ABOUT_VALUES = [
  { title: "One source of truth", body: "The model and the money belong on the same screen. Every Claimo decision is grounded in that principle." },
  { title: "Trust through transparency", body: "Audit trails are not an after-thought. Every state change is permanent, attributed and exportable." },
  { title: "Built with builders", body: "We ship with our customers — contractors, QSs and developers — not for them." },
];

export const ABOUT_TIMELINE = [
  { year: "2023", title: "Founded in Rotterdam", body: "After a decade in QS and BIM consulting, the founding team set out to fix the spreadsheet sprawl of payment claims." },
  { year: "2024", title: "First production projects", body: "Three pilot contractors processed €18M of claims through the platform in the first six months." },
  { year: "2025", title: "Series A", body: "Raised €7M led by Northzone to grow the engineering team and expand across the Benelux and DACH." },
  { year: "2026", title: "Today", body: "Used by 140+ construction companies on projects from €500K renovations to €400M infrastructure builds." },
];

export const CONTACT_CHANNELS = [
  // { title: "Sales", body: "Pricing, demos and procurement.", email: "sales@claimo.app" },
  { title: "Support", body: "Existing customers — we reply within one business day.", email: "support@claimo.app" },
  // { title: "Security", body: "Responsible disclosure and security questionnaires.", email: "security@claimo.app" },
  // { title: "Press", body: "Media enquiries and brand assets.", email: "press@claimo.app" },
];

export const CONTACT_OFFICE = {
  line1: "Claimo Technologies B.V.",
  line2: "Junkernstrasse",
  line3: "65205 Wiesbaden",
  line4: "Germany",
  // vat: "NL864123456B01",
  // kvk: "84512987",
};

export const HELP_CATEGORIES = [
  { title: "Account", body: "Sign-in, password reset, two-factor auth, profile and notification preferences." },
  // { title: "Billing", body: "Invoices, VAT, payment methods, plan upgrades and cancellations." },
  { title: "Projects", body: "Creating projects, inviting members, archiving and project-level permissions." },
  { title: "Claims & approvals", body: "Submitting, editing, withdrawing and the rules around partial claims." },
  { title: "Viewer & models", body: "Supported formats, upload errors and performance tuning for large models." },
  { title: "Security & data", body: "Encryption, residency, exports, deletion requests and incident reporting." },
];