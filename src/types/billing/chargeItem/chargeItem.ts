import { MonetaryComponent } from "@/types/base/monetaryComponent/monetaryComponent";
import { ChargeItemDefinitionBase } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";

export enum ChargeItemStatus {
  planned = "planned",
  billable = "billable",
  not_billable = "not_billable",
  aborted = "aborted",
  billed = "billed",
  paid = "paid",
  entered_in_error = "entered_in_error",
}

export const CHARGE_ITEM_STATUS_STYLES = {
  planned: "bg-gray-100 text-gray-800 border-gray-200",
  billable: "bg-blue-100 text-blue-800 border-blue-200",
  not_billable: "bg-yellow-100 text-yellow-800 border-yellow-200",
  aborted: "bg-red-100 text-red-800 border-red-200",
  billed: "bg-green-100 text-green-800 border-green-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  entered_in_error: "bg-red-100 text-red-800 border-red-200",
} as const;

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
  unit_price_components: MonetaryComponent[];
  note?: string;
  override_reason?: ChargeItemOverrideReason;
}

export interface ChargeItemCreate extends Omit<ChargeItemBase, "id"> {
  encounter: string;
  account?: string;
}

export interface ChargeItemUpdate extends ChargeItemBase {
  account?: string;
}

export interface ChargeItemRead extends ChargeItemBase {
  total_price_components: MonetaryComponent[];
  total_price: number;
  charge_item_definition: ChargeItemDefinitionBase;
}
