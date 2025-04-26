import { MonetoryComponent } from "@/types/base/monetoryComponent/monetoryComponent";

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
  price_component: MonetoryComponent[];
}

export interface ChargeItemDefinitionRead extends ChargeItemDefinitionBase {
  version: number | null;
}

export interface ChargeItemDefinitionCreate
  extends Omit<ChargeItemDefinitionBase, "id"> {
  patient: string;
}
