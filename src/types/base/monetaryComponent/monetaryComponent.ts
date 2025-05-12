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

export const MonetaryComponentOrder = {
  informational: 1,
  base: 2,
  surcharge: 3,
  discount: 4,
  tax: 5,
} as const satisfies Record<MonetaryComponentType, number>;
