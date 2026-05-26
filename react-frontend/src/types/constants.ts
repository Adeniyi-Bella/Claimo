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
