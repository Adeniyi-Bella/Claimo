export type PaymentStatus = "NOT_STARTED" | "SUBMITTED" | "APPROVED" | "REJECTED";
export type ProjectRole = "ADMIN" | "CONTRACTOR" | "VIEWER";
export type ProjectStatus = "Active" | "Completed" | "Archived";

export interface Member {
  id: string;
  name: string;
  email: string;
  role: ProjectRole;
  joined: string;
  avatarHue: number;
}

export interface PaymentItem {
  id: string;
  category: string;
  modelId: string;
  modelName: string;
  contractorId: string;
  contractorName: string;
  contractValue: number;
  submittedAmount?: number;
  status: PaymentStatus;
  description?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  updatedAt: string;
  audit: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  user: string;
  oldStatus: PaymentStatus | "—";
  newStatus: PaymentStatus;
  comment?: string;
  timestamp: string;
}

export interface ProjectModel {
  id: string;
  name: string;
  uploadedAt: string;
  uploadedBy: string;
  paymentItems: PaymentItem[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  status: ProjectStatus;
  members: Member[];
  models: ProjectModel[];
}

export const CATEGORIES = [
  "Foundations", "Concrete Works", "Reinforcement", "Brickwork", "Carpentry",
  "Roofing", "Plumbing", "Electrical", "HVAC", "Plastering",
  "Tiling", "Painting", "Glazing", "Landscaping", "Demolition",
  "Excavation", "Drainage", "Fire Protection", "Insulation",
];

const members: Member[] = [
  { id: "u1", name: "Elena Marchetti", email: "elena@northpeak.co", role: "ADMIN", joined: "2025-01-12", avatarHue: 250 },
  { id: "u2", name: "Marcus Hale", email: "marcus@northpeak.co", role: "ADMIN", joined: "2025-01-12", avatarHue: 200 },
  { id: "u3", name: "Priya Shah", email: "priya@apex-build.com", role: "CONTRACTOR", joined: "2025-02-03", avatarHue: 25 },
  { id: "u4", name: "Tomás Rivera", email: "tomas@rivera-mep.com", role: "CONTRACTOR", joined: "2025-02-08", avatarHue: 145 },
  { id: "u5", name: "Aiko Tanaka", email: "aiko@finishworks.io", role: "CONTRACTOR", joined: "2025-02-19", avatarHue: 320 },
  { id: "u6", name: "Daniel Okafor", email: "daniel@steelframe.co", role: "CONTRACTOR", joined: "2025-03-01", avatarHue: 80 },
  { id: "u7", name: "Sara Lindqvist", email: "sara.l@northpeak.co", role: "VIEWER", joined: "2025-03-14", avatarHue: 290 },
];

function makeItems(modelId: string, modelName: string, seed: number): PaymentItem[] {
  const picks = [
    { cat: "Foundations", c: "u3", v: 184000, s: "APPROVED" as PaymentStatus, sub: 184000 },
    { cat: "Concrete Works", c: "u3", v: 312500, s: "APPROVED" as PaymentStatus, sub: 312500 },
    { cat: "Reinforcement", c: "u6", v: 96400, s: "SUBMITTED" as PaymentStatus, sub: 88200 },
    { cat: "Electrical", c: "u4", v: 142000, s: "SUBMITTED" as PaymentStatus, sub: 142000 },
    { cat: "Plumbing", c: "u4", v: 78600, s: "REJECTED" as PaymentStatus, sub: 78600 },
    { cat: "HVAC", c: "u4", v: 168000, s: "NOT_STARTED" as PaymentStatus },
    { cat: "Tiling", c: "u5", v: 42000, s: "NOT_STARTED" as PaymentStatus },
    { cat: "Painting", c: "u5", v: 28400, s: "NOT_STARTED" as PaymentStatus },
  ];
  return picks.slice(0, 4 + (seed % 4)).map((p, i) => ({
    id: `${modelId}-pi-${i}`,
    category: p.cat,
    modelId,
    modelName,
    contractorId: p.c,
    contractorName: members.find(m => m.id === p.c)!.name,
    contractValue: p.v,
    submittedAmount: p.sub,
    status: p.s,
    description: p.s !== "NOT_STARTED" ? "Work completed per schedule. Inspections passed." : undefined,
    submittedAt: p.s !== "NOT_STARTED" ? "2025-04-22T10:14:00Z" : undefined,
    reviewedBy: p.s === "APPROVED" || p.s === "REJECTED" ? "Elena Marchetti" : undefined,
    reviewedAt: p.s === "APPROVED" || p.s === "REJECTED" ? "2025-04-24T16:02:00Z" : undefined,
    updatedAt: "2025-04-24T16:02:00Z",
    audit: [
      { id: "a1", user: members.find(m => m.id === p.c)!.name, oldStatus: "—", newStatus: "NOT_STARTED", timestamp: "2025-03-01T09:00:00Z" },
      ...(p.s !== "NOT_STARTED" ? [{ id: "a2", user: members.find(m => m.id === p.c)!.name, oldStatus: "NOT_STARTED" as PaymentStatus, newStatus: "SUBMITTED" as PaymentStatus, comment: "Submitted for review", timestamp: "2025-04-22T10:14:00Z" }] : []),
      ...(p.s === "APPROVED" ? [{ id: "a3", user: "Elena Marchetti", oldStatus: "SUBMITTED" as PaymentStatus, newStatus: "APPROVED" as PaymentStatus, comment: "Verified on site.", timestamp: "2025-04-24T16:02:00Z" }] : []),
      ...(p.s === "REJECTED" ? [{ id: "a3", user: "Elena Marchetti", oldStatus: "SUBMITTED" as PaymentStatus, newStatus: "REJECTED" as PaymentStatus, comment: "Pressure test failed on riser 3. Please redo and resubmit.", timestamp: "2025-04-24T16:02:00Z" }] : []),
    ],
  }));
}

export const PROJECTS: Project[] = [
  {
    id: "harbor-tower",
    name: "Harbor Tower — Phase II",
    description: "32-story mixed-use tower with retail podium, residential units 5–28, and amenity deck.",
    location: "Rotterdam, NL",
    startDate: "2025-02-10",
    status: "Active",
    members: members.slice(0, 6),
    models: [
      { id: "m1", name: "Structural — Levels B2 to L08", uploadedAt: "2025-02-14", uploadedBy: "Elena Marchetti", paymentItems: makeItems("m1", "Structural — Levels B2 to L08", 7) },
      { id: "m2", name: "MEP — Risers & Mech. Floors", uploadedAt: "2025-02-22", uploadedBy: "Marcus Hale", paymentItems: makeItems("m2", "MEP — Risers & Mech. Floors", 5) },
      { id: "m3", name: "Architectural — Podium Retail", uploadedAt: "2025-03-09", uploadedBy: "Marcus Hale", paymentItems: makeItems("m3", "Architectural — Podium Retail", 3) },
    ],
  },
  {
    id: "civic-library",
    name: "Civic Library Renewal",
    description: "Adaptive reuse of historic library with new reading hall, mezzanine, and seismic upgrades.",
    location: "Lisbon, PT",
    startDate: "2025-01-08",
    status: "Active",
    members: [members[0], members[2], members[4], members[6]],
    models: [
      { id: "m4", name: "Existing + Proposed Composite", uploadedAt: "2025-01-15", uploadedBy: "Elena Marchetti", paymentItems: makeItems("m4", "Existing + Proposed Composite", 6) },
      { id: "m5", name: "Reading Hall — Roof Structure", uploadedAt: "2025-02-04", uploadedBy: "Elena Marchetti", paymentItems: makeItems("m5", "Reading Hall — Roof Structure", 4) },
    ],
  },
  {
    id: "ridgeline-campus",
    name: "Ridgeline Campus Block C",
    description: "Three-story office block with underground parking and rooftop solar array.",
    location: "Zürich, CH",
    startDate: "2024-11-04",
    status: "Active",
    members: [members[0], members[1], members[3], members[5]],
    models: [
      { id: "m6", name: "Block C — Full Discipline", uploadedAt: "2024-11-12", uploadedBy: "Marcus Hale", paymentItems: makeItems("m6", "Block C — Full Discipline", 8) },
    ],
  },
  {
    id: "north-bridge",
    name: "North Bridge Pedestrian Crossing",
    description: "Cable-stayed pedestrian bridge over the canal with integrated lighting and landscaping.",
    location: "Copenhagen, DK",
    startDate: "2024-09-20",
    status: "Completed",
    members: [members[0], members[2], members[5]],
    models: [
      { id: "m7", name: "Bridge — Structural & Cables", uploadedAt: "2024-09-25", uploadedBy: "Elena Marchetti", paymentItems: makeItems("m7", "Bridge — Structural & Cables", 2) },
    ],
  },
  {
    id: "valley-school",
    name: "Valley School Annex",
    description: "Two-classroom annex with gym extension and accessible entry.",
    location: "Innsbruck, AT",
    startDate: "2025-03-25",
    status: "Active",
    members: [members[0], members[4], members[6]],
    models: [
      { id: "m8", name: "Annex — Architectural", uploadedAt: "2025-03-28", uploadedBy: "Elena Marchetti", paymentItems: makeItems("m8", "Annex — Architectural", 3) },
    ],
  },
];

export const COMPANY = {
  name: "Northpeak Build Group",
  members,
};

export const CURRENT_USER = {
  ...members[0],
  companyRole: "ACCOUNT_OWNER" as const,
};

export function projectSummary(p: Project) {
  const items = p.models.flatMap(m => m.paymentItems);
  const total = items.reduce((s, i) => s + i.contractValue, 0);
  const approved = items.filter(i => i.status === "APPROVED").reduce((s, i) => s + (i.submittedAmount ?? 0), 0);
  const submitted = items.filter(i => i.status === "SUBMITTED").reduce((s, i) => s + (i.submittedAmount ?? 0), 0);
  const rejected = items.filter(i => i.status === "REJECTED").reduce((s, i) => s + (i.submittedAmount ?? 0), 0);
  return { total, approved, submitted, rejected, remaining: total - approved, itemCount: items.length };
}

export function modelSummary(m: ProjectModel) {
  const total = m.paymentItems.reduce((s, i) => s + i.contractValue, 0);
  const approved = m.paymentItems.filter(i => i.status === "APPROVED").reduce((s, i) => s + (i.submittedAmount ?? 0), 0);
  const submitted = m.paymentItems.filter(i => i.status === "SUBMITTED").reduce((s, i) => s + (i.submittedAmount ?? 0), 0);
  return { total, approved, submitted };
}

export function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
