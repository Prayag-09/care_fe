import { Patient } from "@/types/emr/newPatient";
import { Period } from "@/types/questionnaire/base";

export enum AccountStatus {
  active = "active",
  inactive = "inactive",
  entered_in_error = "entered_in_error",
  on_hold = "on_hold",
}

export enum AccountBillingStatus {
  open = "open",
  carecomplete_notbilled = "carecomplete_notbilled",
  billing = "billing",
  closed_baddebt = "closed_baddebt",
  closed_voided = "closed_voided",
  closed_completed = "closed_completed",
  closed_combined = "closed_combined",
}

export interface AccountBase {
  id: string;
  status: AccountStatus;
  billing_status: AccountBillingStatus;
  name: string;
  service_period: Period;
  description: string | null;
}

export interface AccountRead extends AccountBase {
  patient: Patient;
}

export interface AccountUpdate extends AccountBase {
  id: string;
  patient: string;
}

export interface AccountCreate extends Omit<AccountBase, "id"> {
  patient: string;
}
