import { Code } from "@/types/base/code/code";
import { Encounter } from "@/types/emr/encounter";
import { ObservationRead } from "@/types/emr/observation/observation";
import { UserBase } from "@/types/user/user";

export enum DiagnosticReportStatus {
  registered = "registered",
  partial = "partial",
  preliminary = "preliminary",
  modified = "modified",
  final = "final",
}

export const DIAGNOSTIC_REPORT_STATUS_COLORS = {
  registered: "secondary",
  partial: "yellow",
  preliminary: "blue",
  modified: "orange",
  final: "green",
} as const satisfies Record<DiagnosticReportStatus, string>;

export interface DiagnosticReportBase {
  id: string;
  status: DiagnosticReportStatus;
  category: Code;
  code?: Code;
  note?: string;
  conclusion?: string;
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
  created_date: string;
  updated_by: UserBase;
}
