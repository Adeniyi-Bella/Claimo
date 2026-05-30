import type { PaymentItemLocal } from "./store";

export type ViewerFileType = "ifc";

export interface ViewerModelRecord {
  id: string;
  name: string;
  fileType: ViewerFileType;
  fileUrl?: string;
  paymentItems?: PaymentItemLocal[];
}

export interface ViewerProjectRecord {
  id: string;
  models: ViewerModelRecord[];
  [key: string]: unknown;
}