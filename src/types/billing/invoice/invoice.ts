import { MonetoryComponent } from "@/types/base/monetoryComponent/monetoryComponent";
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";

export enum InvoiceStatus {
  draft = "draft",
  issued = "issued",
  balanced = "balanced",
  cancelled = "cancelled",
  entered_in_error = "entered_in_error",
}

export interface InvoiceBase {
  id: string;
  title: string;
  status: InvoiceStatus;
  cancalled_reason?: string | null;
  payment_terms?: string | null;
  note?: string | null;
}

export interface InvoiceCreate extends Omit<InvoiceBase, "id"> {
  account: string;
  charge_items: string[];
}

export interface InvoiceRead extends InvoiceBase {
  charge_items: ChargeItemRead[];
  total_price_component: MonetoryComponent[];
  total_net: number;
  total_gross: number;
}
