import { Code } from "@/types/questionnaire/code";

export enum MonetoryComponentType {
  base = "base",
  surcharge = "surcharge",
  discount = "discount",
  tax = "tax",
  informational = "informational",
}

export interface MonetoryComponent {
  monetory_component_type: MonetoryComponentType;
  code: Code | null;
  factor?: number | null;
  amount?: number | null;
}
