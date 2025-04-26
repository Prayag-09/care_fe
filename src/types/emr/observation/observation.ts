import { ObservationDefinitionReadSpec } from "@/types/emr/observationDefinition/observationDefinition";
import { Code } from "@/types/questionnaire/code";
import { QuestionType } from "@/types/questionnaire/question";
import { SubjectType } from "@/types/questionnaire/questionnaire";
import { UserBase } from "@/types/user/user";

export enum ObservationStatus {
  FINAL = "final",
  AMENDED = "amended",
}

export enum PerformerType {
  RELATED_PERSON = "related_person",
  USER = "user",
}

export interface Performer {
  type: PerformerType;
  id: string;
}

export interface ObservationReferenceRange {
  low?: number;
  high?: number;
  unit?: string;
  text?: string;
}

export interface Coding {
  system?: string;
  version?: string;
  code: string;
  display?: string;
}

export type QuestionnaireSubmitResultValue = {
  value?: string | null;
  unit?: Coding;
  coding?: Coding;
};

// Based on backend Component
export interface ObservationComponent {
  value: QuestionnaireSubmitResultValue;
  interpretation?: string | null;
  reference_range?: ObservationReferenceRange[];
  code?: Code | null;
  note?: string;
}

export interface CodeableConcept {
  id?: string;
  coding?: Code[];
  text?: string | null;
}

// Based on backend BaseObservationSpec
export interface ObservationBase {
  id: string; // UUID4 | null
  status: ObservationStatus;
  category?: Code | null;
  main_code?: Code | null;
  alternate_coding?: CodeableConcept | null;
  subject_type: SubjectType;
  encounter: string | null; // UUID4 | null
  effective_datetime: string; // datetime
  performer?: Performer | null;
  value_type: QuestionType;
  value: QuestionnaireSubmitResultValue;
  note?: string | null;
  body_site?: Code | null; // ValueSetBoundCoding<...>
  method?: Code | null; // ValueSetBoundCoding<...>
  reference_range?: ObservationReferenceRange[];
  interpretation?: string | null;
  parent?: string | null; // UUID4 | null
  questionnaire_response?: string | null; // UUID4 | null
  component?: ObservationComponent[];
}

export interface ObservationRead extends ObservationBase {
  created_by: UserBase;
  updated_by: UserBase;
  data_entered_by?: UserBase | null;
  observation_definition?: ObservationDefinitionReadSpec | null;
}

export type ObservationCreate = Omit<ObservationBase, "id">;

export interface ObservationUpdate {
  observation_id: string;
  observation: Partial<ObservationCreate>;
}

export interface ObservationFromDefinitionCreate {
  observation_definition: string;
  observation: Partial<ObservationCreate>;
}
