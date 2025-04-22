import { Code } from "@/types/questionnaire/code";
import { UserBase } from "@/types/user/user";

export const SPECIMEN_DEFINITION_STATUS_OPTIONS = [
  "draft",
  "active",
  "retired",
  "unknown",
] as const;

export type SpecimenDefinitionStatusOptions =
  (typeof SPECIMEN_DEFINITION_STATUS_OPTIONS)[number];

export const PREFERENCE_OPTIONS = ["preferred", "required"] as const;

export interface QuantitySpec {
  value: number;
  unit: Code;
}

export interface MinimumVolumeSpec {
  value: number;
  unit: Code;
}

export interface DurationSpec {
  value: number;
  unit: Code;
}

export interface ContainerSpec {
  description: string | null;
  capacity: QuantitySpec | null;
  minimum_volume: MinimumVolumeSpec | null;
  cap: Code | null;
  preparation: string | null;
}

export const SPECIMEN_DEFINITION_UNITS_CODES = [
  {
    code: "mg",
    display: "milligram",
    system: "http://unitsofmeasure.org",
  },
  {
    code: "g",
    display: "gram",
    system: "http://unitsofmeasure.org",
  },
  {
    code: "mL",
    display: "milliliter",
    system: "http://unitsofmeasure.org",
  },
  {
    code: "[drp]",
    display: "drop",
    system: "http://unitsofmeasure.org",
  },
  {
    code: "ug",
    display: "microgram",
    system: "http://unitsofmeasure.org",
  },
] as const;

export const RETENTION_TIME_UNITS = [
  { code: "h", display: "hours", system: "http://unitsofmeasure.org" },
  { code: "d", display: "days", system: "http://unitsofmeasure.org" },
] as const;

export type PreferenceOptions = (typeof PREFERENCE_OPTIONS)[number];

export interface TypeTestedSpec {
  is_derived: boolean;
  specimen_type: Code | null;
  preference: PreferenceOptions;
  container: ContainerSpec | null;
  requirement: string | null;
  retention_time: DurationSpec | null;
  single_use: boolean | null;
}

export interface SpecimenDefinitionRequest {
  title: string;
  slug: string;
  derived_from_uri: string | null;
  status: SpecimenDefinitionStatusOptions;
  description: string | null;
  type_collected: Code | null;
  patient_preparation: Code[] | null;
  collection: Code | null;
  type_tested: TypeTestedSpec | null;
}

export interface SpecimenDefinitionRead extends SpecimenDefinitionRequest {
  id: string;
  created_by: UserBase;
  updated_by: UserBase;
  created_at: string;
  updated_at: string;
}
