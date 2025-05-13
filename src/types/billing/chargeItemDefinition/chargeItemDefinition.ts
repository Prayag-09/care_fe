import { MonetaryComponent } from "@/types/base/monetaryComponent/monetaryComponent";

export enum ChargeItemDefinitionStatus {
  draft = "draft",
  active = "active",
  retired = "retired",
}

export interface ChargeItemDefinitionBase {
  id: string;
  status: ChargeItemDefinitionStatus;
  title: string;
  slug: string;
  derived_from_uri: string | null;
  description: string | null;
  purpose: string | null;
  price_components: MonetaryComponent[];
}

export interface ChargeItemDefinitionRead extends ChargeItemDefinitionBase {
  version?: number | null;
}

export interface ChargeItemDefinitionCreate
  extends Omit<ChargeItemDefinitionBase, "id"> {
  version?: number | null;
}
