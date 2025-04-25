import {
  DurationSpec,
  QuantitySpec,
  SpecimenDefinitionRead,
  TypeTestedSpec,
} from "@/types/emr/specimenDefinition/specimenDefinition";
import { Code } from "@/types/questionnaire/code";
import { UserBase } from "@/types/user/user";

export enum SpecimenStatus {
  available = "available",
  unavailable = "unavailable",
  unsatisfactory = "unsatisfactory",
  entered_in_error = "entered_in_error",
}

export interface CollectionSpec {
  collector: string | null;
  collected_date_time: string | null;
  quantity: QuantitySpec | null;
  method: Code | null;
  procedure: string | null;
  body_site: Code | null;
  fasting_status_codeable_concept: Code | null;
  fasting_status_duration: DurationSpec | null;
}

export interface ProcessingSpec {
  description: string;
  method: Code | null;
  performer: string | null;
  time_date_time: string | null;
}

export interface SpecimenBase {
  id: string;
  accession_identifier: string;
  status: SpecimenStatus;
  specimen_type: Code | null;
  received_time: string | null;
  collection: CollectionSpec | null;
  processing: ProcessingSpec[];
  condition: Code[];
  note: string | null;
}

export interface SpecimenFromDefinitionCreate {
  specimen_definition: string;
  specimen: Omit<SpecimenBase, "id">;
}

export interface SpecimenRead extends SpecimenBase {
  created_by: UserBase;
  updated_by: UserBase;
  created_at: string;
  updated_at: string;
  type_tested: TypeTestedSpec | null;
  specimen_definition: SpecimenDefinitionRead;
}
