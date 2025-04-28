import { MonetoryComponent } from "@/types/base/monetoryComponent/monetoryComponent";

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
  display?: string | null;
}

export interface ChargeItemBase {
  id: string;
  status: ChargeItemStatus;
  quantity: number;
  unit_price_component: MonetoryComponent[];
  note?: string | null;
  override_reason: ChargeItemOverrideReason | null;
}

export interface ChargeItemCreate extends Omit<ChargeItemBase, "id"> {
  encounter: string;
  account: string;
}

export interface ChargeItemRead extends ChargeItemBase {
  total_price_component: MonetoryComponent[];
  total_price: number;
}
