import type { PaymentItemCategory } from "@/types";
import type {
  CompanyRole,
  JobStatus,
  PaymentStatusType,
  ProjectRole,
} from "./responseDto";

export interface CreateProjectRequestDto {
  name: string;
  description?: string | null;
  location?: string | null;
  startDate?: string | null;
}

export interface InviteMemberRequestDto {
  fullName: string;
  email: string;
  role: ProjectRole;
}

export interface InviteCompanyMemberRequestDto {
  name: string;
  email: string;
  role: CompanyRole;
}

export interface CreatePaymentItemRequestDto {
  modelId: string;
  category: PaymentItemCategory;
  contractorId: string | null;
  approverId: string | null;
  contractValue: number;
  description?: string;
}

export interface SubmitClaimRequestDto {
  amount: number;
  description: string;
}

export interface DecideClaimRequestDto {
  decision: "APPROVED" | "REJECTED";
  note?: string;
}

export interface UpdateJobStatusRequestDto {
  status: JobStatus;
}

export interface UpdatePaymentStatusRequestDto {
  status: PaymentStatusType;
}
