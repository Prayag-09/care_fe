// Correct the path if needed
// AI Warning: This file is not complete
import { ObservationDefinitionReadSpec } from "@/types/emr/observationDefinition/observationDefinition";
import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";
import { SpecimenRead } from "@/types/emr/specimen/specimen";
import { Code } from "@/types/questionnaire/code";
import { UserBase } from "@/types/user/user";

export interface ObservationValueQuantity {
  value: number;
  unit: string; // Or Code?
  system?: string;
  code?: string;
}

export interface ObservationReferenceRange {
  low?: ObservationValueQuantity;
  high?: ObservationValueQuantity;
  type?: Code;
  applies_to?: Code[];
  text?: string;
}

export interface ObservationBase {
  id: string;
  status: string; // e.g., 'final', 'amended', 'preliminary'
  category?: Code[];
  code: Code; // Link to the type of observation
  subject?: { id: string; resource_type: string }; // Link to Patient
  encounter?: { id: string }; // Link to Encounter
  effective_date_time?: string;
  issued?: string;
  performer?: UserBase[]; // Or reference to Practitioner/Organization
  value_quantity?: ObservationValueQuantity;
  value_string?: string;
  value_codeable_concept?: Code;
  interpretation?: Code[];
  note?: string; // Annotations/Notes
  body_site?: Code;
  method?: Code;
  specimen?: { id: string }; // Link to Specimen
  reference_range?: ObservationReferenceRange[];
  derived_from?: { id: string; resource_type: string }[]; // Link to parent Observations or ServiceRequest
  observation_definition?: ObservationDefinitionReadSpec; // Optional: Embed definition?
  service_request?: ServiceRequestReadSpec; // Optional: Embed request?
}

export interface ObservationRead extends ObservationBase {
  created_by: UserBase;
  updated_by: UserBase;
  created_at: string;
  updated_at: string;
  specimen_object?: SpecimenRead;
}

export interface ObservationCreate
  extends Omit<
    ObservationBase,
    "id" | "issued" | "observation_definition" | "service_request" | "performer"
  > {
  status: string;
  code: Code;
  subject: { id: string; resource_type: string };
  service_request_id?: string;
  specimen_id?: string;
  observation_definition_id?: string;
}
