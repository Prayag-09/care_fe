import {
  ActivityDefinitionReadSpec,
  Category,
} from "@/types/emr/activityDefinition/activityDefinition";
import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import { Encounter } from "@/types/emr/encounter";
import { ObservationRead } from "@/types/emr/observation/observation";
import { SpecimenRead } from "@/types/emr/specimen/specimen";
import { LocationList } from "@/types/location/location";
import { Code } from "@/types/questionnaire/code";
import { UserBase } from "@/types/user/user";

export enum Status {
  draft = "draft",
  active = "active",
  on_hold = "on_hold",
  entered_in_error = "entered_in_error",
  ended = "ended",
  completed = "completed",
  revoked = "revoked",
  unknown = "unknown",
}

export const SPECIMEN_STATUS_STYLES = {
  draft: "bg-gray-100 text-gray-800 border-gray-200",
  active: "bg-green-100 text-green-800 border-green-200",
  on_hold: "bg-yellow-100 text-yellow-800 border-yellow-200",
  entered_in_error: "bg-red-100 text-red-800 border-red-200",
  ended: "bg-gray-100 text-gray-800 border-gray-200",
  completed: "bg-blue-100 text-blue-800 border-blue-200",
  revoked: "bg-purple-100 text-purple-800 border-purple-200",
  unknown: "bg-gray-100 text-gray-800 border-gray-200",
} as const;

export const SPECIMEN_PRIORITY_STYLES = {
  routine: "bg-gray-100 text-gray-800 border-gray-200",
  urgent: "bg-yellow-100 text-yellow-800 border-yellow-200",
  asap: "bg-red-100 text-red-800 border-red-200",
  stat: "bg-blue-100 text-blue-800 border-blue-200",
} as const;

export enum Intent {
  order = "order",
  proposal = "proposal",
  plan = "plan",
  directive = "directive",
}

export enum Priority {
  routine = "routine",
  urgent = "urgent",
  asap = "asap",
  stat = "stat",
}

export interface BaseServiceRequestSpec {
  id: string;
  title: string;
  status: Status;
  intent: Intent;
  priority: Priority;
  category: Category;
  do_not_perform: boolean;
  note: string | null;
  code: Code;
  body_site: Code | null;
  occurance: string | null;
  patient_instruction: string | null;
}

export interface ServiceRequestCreateSpec
  extends Omit<BaseServiceRequestSpec, "id"> {
  encounter: string;
  locations: string[];
}

export interface ServiceRequestApplyActivityDefinitionSpec {
  encounter: string;
  activity_definition: string;
  service_request: Omit<BaseServiceRequestSpec, "id"> & {
    locations: string[];
  };
}

export interface ServiceRequestUpdateSpec extends BaseServiceRequestSpec {
  encounter: string;
  locations: string[];
}

export interface ServiceRequestReadSpec extends BaseServiceRequestSpec {
  version?: number;
  locations: LocationList[];
  encounter: Encounter;
  activity_definition: ActivityDefinitionReadSpec;
  specimens: SpecimenRead[];
  observations?: ObservationRead[];
  diagnostic_reports: DiagnosticReportRead[];
  created_by: UserBase;
  updated_by: UserBase;
  created_at: string;
  updated_at: string;
}
