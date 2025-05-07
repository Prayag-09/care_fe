import { Code } from "@/types/questionnaire/code";

export enum MonetaryComponentType {
  base = "base",
  discount = "discount",
  tax = "tax",
  surcharge = "surcharge",
  informational = "informational",
}

export interface MonetaryComponent {
  monetary_component_type: MonetaryComponentType;
  code?: Code | null;
  factor?: number | null;
  amount?: number | null;
}

export interface MonetaryComponentRead extends MonetaryComponent {
  title: string;
}
