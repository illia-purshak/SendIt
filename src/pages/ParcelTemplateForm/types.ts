import type { ParcelItemType } from "@/types/parcel-templates";

export interface ItemDraft {
  id?: number;
  type: ParcelItemType;
  documentType: string;
  declaredValue: string;
  weight: string;
  description: string;
  height: string;
  width: string;
  length: string;
}
