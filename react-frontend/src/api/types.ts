export type ClaimDecision = "SUBMITTED" | "APPROVED" | "REJECTED";
export type PaymentStatus =
  | "NOT_STARTED"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "IN_PROGRESS"
  | "COMPLETED";
export type ProjectRole = "ADMIN" | "CONTRACTOR" | "VIEWER" | "APPROVER";
export type ProjectStatus = "Active" | "Completed" | "Archived";
export type ModelFileType = "ifc";
export type JobStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type PaymentStatusType = "NONE" | "PAID" | "REJECTED" | "APPROVED";
export type AuditField = "JOB_STATUS" | "PAYMENT_STATUS" | "CLAIM" | "SYSTEM";

export interface DashboardAuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: ProjectRole;
  action: string;
  field: AuditField;
  fromValue?: string | null;
  toValue?: string | null;
}

export interface DashboardClaim {
  id: string;
  sequence: number;
  amount: number;
  description: string;
  status: ClaimDecision;
  submittedBy: string;
  submittedById: string;
  submittedAt: string;
  decidedBy?: string | null;
  decidedById?: string | null;
  decidedAt?: string | null;
  decisionNote?: string | null;
  paidAt?: string | null;
}

export interface DashboardPaymentItem {
  id: string;
  category: string;
  modelId: string;
  modelName: string;
  contractorId: string;
  contractorName: string;
  approverId: string;
  approverName: string;
  contractValue: number;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  claims: DashboardClaim[];
  attachedElementIds: string[];
  jobStatus: JobStatus;
  paymentStatus: PaymentStatusType;
  paymentConfirmationPending: boolean;
  auditTrail: DashboardAuditEntry[];
}

export interface DashboardModel {
  id: string;
  name: string;
  fileType: ModelFileType;
  fileUrl?: string | null;
  uploadedAt: string;
  uploadedBy: string;
  paymentItems: DashboardPaymentItem[];
}

export interface DashboardMember {
  id: string;
  name: string;
  email: string;
  role: ProjectRole;
  joined: string;
  avatarHue: number;
}

export interface DashboardProject {
  id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  // status: ProjectStatus;
  // members: DashboardMember[];
  models: DashboardModel[];
}

export interface DashboardCompanyDto {
  id: string;
  name: string;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardUser {
  id: string;
  name: string;
  email: string;
  avatarHue: number;
}

export interface DashboardCompany {
  company: DashboardCompanyDto;
  role: "ACCOUNT_OWNER" | "ADMIN" | "MEMBER";
}

export interface DashboardResponse {
  user: DashboardUser;
  company: DashboardCompany;
  projects: DashboardProject[];
}


