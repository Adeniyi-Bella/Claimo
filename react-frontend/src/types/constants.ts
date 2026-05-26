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