import { Code } from "@/types/questionnaire/code";

export type QuestionType =
  | "boolean"
  | "decimal"
  | "integer"
  | "dateTime"
  | "time"
  | "string"
  | "quantity";

export interface ObservationDefinitionComponentSpec {
  code: Code;
  permitted_data_type: QuestionType;
  permitted_unit: Code;
}

export const OBSERVATION_DEFINITION_CATEGORY = [
  "social_history",
  "vital_signs",
  "imaging",
  "laboratory",
  "procedure",
  "survey",
  "exam",
  "therapy",
  "activity",
] as string[];

export interface BaseObservationDefinitionSpec {
  id: string;
  slug: string;
  title: string;
  status: ObservationDefinitionStatus;
  description: string;
  category: (typeof OBSERVATION_DEFINITION_CATEGORY)[number];
  code: Code;
  permitted_data_type: QuestionType;
  component: ObservationDefinitionComponentSpec[];
  body_site?: Code;
  method?: Code;
  permitted_unit?: Code;
  derived_from_uri?: string;
}

export interface ObservationDefinitionCreateSpec
  extends BaseObservationDefinitionSpec {
  facility: string;
}

export interface ObservationDefinitionReadSpec
  extends BaseObservationDefinitionSpec {
  version?: number;
}

export const OBSERVATION_DEFINITION_STATUS = [
  "draft",
  "active",
  "retired",
  "unknown",
] as const;

export type ObservationDefinitionStatus =
  (typeof OBSERVATION_DEFINITION_STATUS)[number];
