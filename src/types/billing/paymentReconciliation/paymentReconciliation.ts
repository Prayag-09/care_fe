import { InvoiceRead } from "@/types/billing/invoice/invoice";

export enum PaymentReconciliationType {
  payment = "payment",
  adjustment = "adjustment",
  advance = "advance",
}

export enum PaymentReconciliationStatus {
  active = "active",
  cancelled = "cancelled",
  draft = "draft",
  entered_in_error = "entered_in_error",
}

export enum PaymentReconciliationKind {
  deposit = "deposit",
  preriodic_payment = "preriodic_payment",
  online = "online",
  kiosk = "kiosk",
}

export enum PaymentReconciliationIssuerType {
  patient = "patient",
  insurance = "insurance",
}

export enum PaymentReconciliationOutcome {
  queued = "queued",
  complete = "complete",
  error = "error",
  partial = "partial",
}

export enum PaymentReconciliationPaymentMethod {
  cash = "cash",
  ccca = "ccca",
  cchk = "cchk",
  cdac = "cdac",
  chck = "chck",
  ddpo = "ddpo",
  debc = "debc",
}

export interface PaymentReconciliationBase {
  id: string;
  reconciliation_type: PaymentReconciliationType;
  status: PaymentReconciliationStatus;
  kind: PaymentReconciliationKind;
  issuer_type: PaymentReconciliationIssuerType;
  outcome: PaymentReconciliationOutcome;
  disposition?: string | null;
  payment_datetime?: string | null;
  method: PaymentReconciliationPaymentMethod;
  reference_number?: string | null;
  authorization?: string | null;
  tendered_amount?: number | null;
  returned_amount?: number | null;
  note?: string | null;
  amount?: number | null;
}

export interface PaymentReconciliationCreate
  extends Omit<PaymentReconciliationBase, "id"> {
  target_invoice: string;
  account: string;
}

export interface PaymentReconciliationRead extends PaymentReconciliationBase {
  target_invoice: InvoiceRead;
}
