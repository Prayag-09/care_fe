import { Encounter } from "@/types/emr/encounter";
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

export const DIAGNOSTIC_REPORT_STATUS_COLORS: Record<
  DiagnosticReportStatus,
  string
> = {
  [DiagnosticReportStatus.registered]: "bg-gray-100 text-gray-700",
  [DiagnosticReportStatus.partial]: "bg-yellow-100 text-yellow-700",
  [DiagnosticReportStatus.preliminary]: "bg-blue-100 text-blue-700",
  [DiagnosticReportStatus.modified]: "bg-orange-100 text-orange-700",
  [DiagnosticReportStatus.final]: "bg-green-100 text-green-700",
};

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
  encounter: Encounter;
  observations: ObservationRead[];
  created_by: UserBase;
  updated_by: UserBase;
}
