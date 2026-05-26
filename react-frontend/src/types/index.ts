import type { ReactNode } from "react";

export type FooterLink = { label: string; to: string };
export type FooterColumn = { heading: string; links: FooterLink[] };
export type ProjectStatus = "Active" | "Completed" | "Archived";
export type ProjectRole = "ADMIN" | "CONTRACTOR" | "VIEWER" | "APPROVER";
export type ModelFileType = "ifc";

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
