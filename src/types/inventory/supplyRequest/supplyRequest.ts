import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { LocationBase } from "@/types/location/location";

export enum SupplyRequestStatus {
  draft = "draft",
  active = "active",
  suspended = "suspended",
  cancelled = "cancelled",
  completed = "completed",
  entered_in_error = "entered_in_error",
}

export enum SupplyRequestIntent {
  proposal = "proposal",
  plan = "plan",
  directive = "directive",
  order = "order",
  original_order = "original_order",
  reflex_order = "reflex_order",
  filler_order = "filler_order",
  instance_order = "instance_order",
}

export enum SupplyRequestCategory {
  central = "central",
  nonstock = "nonstock",
}

export enum SupplyRequestPriority {
  routine = "routine",
  urgent = "urgent",
  asap = "asap",
  stat = "stat",
}

export enum SupplyRequestReason {
  patient_care = "patient_care",
  ward_stock = "ward_stock",
}

export interface SupplyRequestBase {
  id: string;
  status: SupplyRequestStatus;
  intent: SupplyRequestIntent;
  category: SupplyRequestCategory;
  priority: SupplyRequestPriority;
  reason: SupplyRequestReason;
  quantity: number;
}

export interface SupplyRequestCreate extends Omit<SupplyRequestBase, "id"> {
  deliver_from?: string; // Location ID
  deliver_to: string; // Location ID
  item: string; // ProductKnowledge ID
}

export interface SupplyRequestRead extends SupplyRequestBase {
  item: ProductKnowledgeBase;
  deliver_from?: LocationBase;
  deliver_to: LocationBase;
}
