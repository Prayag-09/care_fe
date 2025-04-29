import { MonetoryComponent } from "@/types/base/monetoryComponent/monetoryComponent";
import { ChargeItemDefinitionBase } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";

export enum ChargeItemStatus {
  planned = "planned",
  billable = "billable",
  not_billable = "not_billable",
  aborted = "aborted",
  billed = "billed",
  entered_in_error = "entered_in_error",
}

export interface ChargeItemOverrideReason {
  code: string;
  display?: string;
}

export interface ChargeItemBase {
  id: string;
  title: string;
  description?: string;
  status: ChargeItemStatus;
  quantity: number;
  unit_price_component: MonetoryComponent[];
  note?: string;
  override_reason?: ChargeItemOverrideReason;
}

export interface ChargeItemCreate extends Omit<ChargeItemBase, "id"> {
  encounter: string;
  account?: string;
}

export interface ChargeItemRead extends ChargeItemBase {
  total_price_component: MonetoryComponent[];
  total_price: number;
  charge_item_definition: ChargeItemDefinitionBase;
}
