import { Code } from "@/types/base/code/code";
import { UserBase } from "@/types/user/user";

export enum Status {
  draft = "draft",
  active = "active",
  retired = "retired",
  unknown = "unknown",
}

export enum Preference {
  preferred = "preferred",
  alternate = "alternate",
}

export interface QuantitySpec {
  value: number | null;
  unit: Code;
}

export interface MinimumVolumeSpec {
  quantity: QuantitySpec | null;
  string: string | null;
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

export interface TypeTestedSpec {
  is_derived: boolean;
  specimen_type: Code | null;
  preference: Preference;
  container: ContainerSpec | null;
  requirement: string | null;
  retention_time: DurationSpec | null;
  single_use: boolean | null;
}

export interface SpecimenDefinition {
  id: string;
  title: string;
  slug: string;
  derived_from_uri: string | null;
  status: Status;
  description: string | null;
  type_collected: Code | null;
  patient_preparation: Code[] | null;
  collection: Code | null;
  facility: string;
}

export interface SpecimenDefinitionCreate
  extends Omit<SpecimenDefinition, "id" | "facility"> {
  type_tested: TypeTestedSpec | null;
}

export interface SpecimenDefinitionUpdate
  extends Omit<SpecimenDefinition, "facility"> {
  type_tested: TypeTestedSpec | null;
}

export interface SpecimenDefinitionRead extends SpecimenDefinition {
  created_by: UserBase;
  updated_by: UserBase;
  created_at: string;
  updated_at: string;
  type_tested: TypeTestedSpec | null;
}
