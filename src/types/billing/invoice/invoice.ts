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

export interface InvoiceCreate extends InvoiceBase {
  account: string;
}

export interface InvoiceRead extends InvoiceBase {
  charge_items: ChargeItemRead[];
}
