import { Code } from "@/types/base/code/code";

export enum QuestionType {
  boolean = "boolean",
  decimal = "decimal",
  integer = "integer",
  dateTime = "dateTime",
  time = "time",
  string = "string",
  quantity = "quantity",
}

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
  body_site: Code | null;
  method: Code | null;
  permitted_unit: Code | null;
  derived_from_uri?: string;
}

export interface ObservationDefinitionCreateSpec
  extends Omit<BaseObservationDefinitionSpec, "id"> {
  facility: string;
}

export interface ObservationDefinitionUpdateSpec
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
