import type { JobStatus, PaymentStatusType } from "@/api/dto/responseDto";

export interface IfcTreeNode {
  localId: number;
  expressId: string;
  name: string;
  type: string;
  modelId: string;
  children: IfcTreeNode[];
}

export interface PaymentItemLocal {
  id: string;
  category: string;
  modelId: string;
  modelName: string;
  contractorName: string;
  contractValue: number;
  description?: string;
  claims: any[];
  attachedElementIds: string[];
  jobStatus?: JobStatus;
  paymentStatus?: PaymentStatusType;
  paymentConfirmationPending?: boolean;
}
