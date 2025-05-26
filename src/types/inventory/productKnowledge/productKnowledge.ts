import { Code } from "@/types/base/code/code";
import { Duration } from "@/types/base/duration/duration";

export enum ProductKnowledgeType {
  medication = "medication",
  nutritional_product = "nutritional_product",
  consumable = "consumable",
}

export const PRODUCT_KNOWLEDGE_TYPE_COLORS: Record<string, string> = {
  medication: "bg-blue-100 text-blue-700",
  nutritional_product: "bg-green-100 text-green-700",
  consumable: "bg-amber-100 text-amber-700",
};

export const PRODUCT_KNOWLEDGE_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-green-100 text-green-700",
  retired: "bg-red-100 text-red-700",
};

export enum ProductKnowledgeStatus {
  draft = "draft",
  active = "active",
  retired = "retired",
}

export enum ProductNameTypes {
  trade_name = "trade_name",
  alias = "alias",
  original_name = "original_name",
  preferred = "preferred",
}

export interface ProductName {
  name_type: ProductNameTypes;
  name: string;
}

export interface StorageGuideline {
  note: string;
  stability_duration: Duration;
}

export interface ProductDefinition {
  dosage_form: Code;
  intended_routes: Code[];
  // TODO: Add ingredients, nutrients, and drug_characteristic types when BE is ready
  ingredients: Code[];
  nutrients: Code[];
  drug_characteristic: { id?: string };
}

export interface ProductKnowledgeBase {
  id: string;
  slug: string;
  product_type: ProductKnowledgeType;
  status: ProductKnowledgeStatus;
  code?: Code;
  name: string;
  names: ProductName[];
  storage_guidelines: StorageGuideline[];
  definitional?: ProductDefinition;
}

export interface ProductKnowledgeCreate
  extends Omit<ProductKnowledgeBase, "id"> {
  facility: string;
}

export interface ProductKnowledgeUpdate extends ProductKnowledgeBase {
  facility: string;
}
