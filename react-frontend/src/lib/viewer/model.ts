import type { PaymentItemLocal } from "./store";

export type ViewerFileType = "ifc" | "json";

export interface ViewerGeometryJson {
  data: {
    attributes: {
      position: {
        array: number[];
        itemSize: number;
      };
      normal?: {
        array: number[];
        itemSize: number;
      };
    };
    index?: {
      array: number[];
    };
  };
}

export interface ViewerModelRecord {
  id: string;
  name: string;
  fileType: ViewerFileType;
  geometryJson?: ViewerGeometryJson;
  paymentItems?: PaymentItemLocal[];
}

export interface ViewerProjectRecord {
  id: string;
  models: ViewerModelRecord[];
  [key: string]: unknown;
}
