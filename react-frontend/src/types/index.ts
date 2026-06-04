import type { ReactNode } from "react";

export type FooterLink = { label: string; to: string };
export type FooterColumn = { heading: string; links: FooterLink[] };
export type ProjectStatus = "Active" | "Completed" | "Archived";
export type ProjectRole = "ADMIN" | "CONTRACTOR" | "VIEWER" | "APPROVER";
export type ModelFileType = "ifc";
export type ClaimDecision = "SUBMITTED" | "APPROVED" | "REJECTED";
export type JobStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type PaymentStatusType = "NONE" | "PAID" | "REJECTED" | "APPROVED";



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

export interface Member {
  id: string;
  name: string;
  email: string;
  role: ProjectRole;
  joined: string;
  avatarHue: number;
}

export interface ProjectModel {
  id: string;
  name: string;
  fileType: ModelFileType;
  fileUrl?: string;
  uploadedAt: string;
  uploadedBy: string | null;
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

export interface PaymentItem {
  id: string;
  category: string;
  modelId: string;
  modelName: string;
  contractorId: string | null;
  contractorName: string | null;
  approverId: string | null;
  approverName: string | null;
  contractValue: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  claims: Claim[];
  attachedElementIds: string[];
  jobStatus: JobStatus;
  paymentStatus: PaymentStatusType;
  paymentConfirmationPending: boolean;
  auditTrail: AuditEntry[];
}

export interface Claim {
  id: string;
  sequence: number;
  amount: number;
  description: string;
  status: ClaimDecision;
  submittedBy: string;
  submittedById: string;
  submittedAt: string;
  decidedBy?: string;
  decidedById?: string;
  decidedAt?: string;
  decisionNote?: string;
  paidAt?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: ProjectRole;
  action: string;
  field: "JOB_STATUS" | "PAYMENT_STATUS" | "CLAIM" | "SYSTEM";
  fromValue?: string;
  toValue?: string;
}

export type PaymentItemCategory =
  | "FOUNDATIONS"
  | "CONCRETE_WORKS"
  | "REINFORCEMENT"
  | "BRICKWORK"
  | "CARPENTRY"
  | "ROOFING"
  | "PLUMBING"
  | "ELECTRICAL"
  | "HVAC"
  | "PLASTERING"
  | "TILING"
  | "PAINTING"
  | "GLAZING"
  | "LANDSCAPING"
  | "DEMOLITION"
  | "EXCAVATION"
  | "DRAINAGE"
  | "FIRE_PROTECTION"
  | "INSULATION";

  export type PaymentStatus =
  | "NOT_STARTED"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "IN_PROGRESS"
  | "COMPLETED";
