import type { CompanyRole, ProjectRole } from "./responseDto";

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
