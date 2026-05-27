export type ProjectStatus = "Active" | "Completed" | "Archived";
export type ProjectRole = "ADMIN" | "CONTRACTOR" | "VIEWER" | "APPROVER";
export type ModelFileType = "ifc";
export type ClaimDecision = "SUBMITTED" | "APPROVED" | "REJECTED";
export type JobStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type PaymentStatusType = "NONE" | "PAID" | "REJECTED" | "APPROVED";
export enum PendingInviteStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REVOKED = "REVOKED",
}

export type CompanyRole = "ACCOUNT_OWNER" | "ADMIN" | "MEMBER";


export interface CustomApiErrorResponse {
  status: number;
  message: string;
}

export interface CustomApiResponse<T> {
  success: boolean;
  data: T | null;
  error: CustomApiErrorResponse | null;
  timestamp: string;
}

export interface ProjectResponse {
  id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  status: ProjectStatus;
  members: Member[];
  models: ProjectModel[];
  pendingInvites: PendingInvite[];
  currentUserRole: ProjectRole | null;
   currentUserCompanyRole: CompanyRole | null;
}

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
  uploadedBy: string;
  paymentItems: PaymentItem[];
}

export interface PaymentItem {
  id: string;
  category: string;
  modelId: string;
  modelName: string;
  contractorId: string;
  contractorName: string;
  approverId: string;
  approverName: string;
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
  projects: ProjectResponse[];
}

export interface PendingInvite {
  id: string;
  email: string;
  role: ProjectRole;
  status: PendingInviteStatus;
  invitedByName: string;
  createdAt: string;
}

export interface ICompanyMember {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: CompanyRole;
}

export interface ICompanyWithMember {
  companyName: string;
  role: CompanyRole;
  members: ICompanyMember[];
}

