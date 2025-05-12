import { Code } from "@/types/base/code/code";
import { Duration } from "@/types/base/duration/duration";

export enum ProductKnowledgeType {
  medication = "medication",
  nutritional_product = "nutritional_product",
  consumable = "consumable",
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
  code?: Code;
  name: string;
  names: ProductName[];
  storage_guidelines: StorageGuideline[];
  defenitional?: ProductDefinition;
}

export interface ProductKnowledgeCreate
  extends Omit<ProductKnowledgeBase, "id"> {
  facility: string;
}

export interface ProductKnowledgeUpdate extends ProductKnowledgeBase {
  facility: string;
}
