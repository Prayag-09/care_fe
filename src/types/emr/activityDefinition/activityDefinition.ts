import { ObservationDefinitionReadSpec } from "@/types/emr/observationDefinition/observationDefinition";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";
import { LocationList } from "@/types/location/location";
import { Code } from "@/types/questionnaire/code";

export enum Status {
  draft = "draft",
  active = "active",
  retired = "retired",
  unknown = "unknown",
}

export enum Category {
  laboratory = "laboratory",
  imaging = "imaging",
  surgical_procedure = "surgical_procedure",
  counseling = "counseling",
}

export enum Kind {
  service_request = "service_request",
}

export interface BaseActivityDefinitionSpec {
  id: string;
  slug: string;
  title: string;
  derived_from_uri: string | null;
  status: Status;
  description: string;
  usage: string;
  category: Category;
  kind: Kind;
  code: Code;
  body_site: Code | null;
}

export interface ActivityDefinitionCreateSpec
  extends Omit<BaseActivityDefinitionSpec, "id"> {
  facility: string;
  specimen_requirements: string[];
  observation_result_requirements: string[];
  locations: string[];
}

export interface ActivityDefinitionUpdateSpec
  extends BaseActivityDefinitionSpec {
  facility: string;
  specimen_requirements: string[];
  observation_result_requirements: string[];
  locations: string[];
}

export interface ActivityDefinitionReadSpec extends BaseActivityDefinitionSpec {
  version?: number;
  specimen_requirements: SpecimenDefinitionRead[];
  observation_result_requirements: ObservationDefinitionReadSpec[];
  locations: LocationList[];
}
