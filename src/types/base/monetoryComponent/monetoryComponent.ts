import { Code } from "@/types/questionnaire/code";

export enum MonetoryComponentType {
  base = "base",
  discount = "discount",
  tax = "tax",
  surcharge = "surcharge",
  informational = "informational",
}

export interface MonetoryComponent {
  monetory_component_type: MonetoryComponentType;
  code?: Code | null;
  factor?: number | null;
  amount?: number | null;
}

export interface MonetoryComponentRead extends MonetoryComponent {
  title: string;
}
