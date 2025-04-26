import { ObservationRead } from "@/types/emr/observation/observation";
import { Code } from "@/types/questionnaire/code";
import { UserBase } from "@/types/user/user";

export enum DiagnosticReportStatus {
  registered = "registered",
  partial = "partial",
  preliminary = "preliminary",
  modified = "modified",
  final = "final",
}

export interface DiagnosticReportBase {
  id: string;
  status: DiagnosticReportStatus;
  category: Code;
  code?: Code | null;
  note?: string | null;
  conclusion?: string | null;
}

export interface DiagnosticReportCreate
  extends Omit<DiagnosticReportBase, "id"> {
  service_request: string;
}

export interface DiagnosticReportUpdate
  extends Omit<DiagnosticReportBase, "id"> {
  id: string;
}

export interface DiagnosticReportRead extends Omit<DiagnosticReportBase, "id"> {
  id: string;
  observations: ObservationRead[];
  created_by: UserBase;
  updated_by: UserBase;
}
