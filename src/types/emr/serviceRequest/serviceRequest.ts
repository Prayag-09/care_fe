import { Category } from "@/types/emr/activityDefinition/activityDefinition";
import { LocationList } from "@/types/location/location";
import { Code } from "@/types/questionnaire/code";

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
}
