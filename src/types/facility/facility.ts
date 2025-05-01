import { MonetoryComponentRead } from "@/types/base/monetoryComponent/monetoryComponent";
import { Organization } from "@/types/organization/organization";
import { Code } from "@/types/questionnaire/code";

export interface FacilityBareMinimum {
  id: string;
  name: string;
}

export interface BaseFacility {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone_number?: string;
  facility_type: string;
  read_cover_image_url?: string;
  cover_image_url?: string;
  features: number[];
  geo_organization?: string;
  is_public: boolean;
  permissions: string[];
}

export type CreateFacility = Omit<BaseFacility, "id" | "permissions">;

export interface FacilityData {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone_number: string;
  facility_type: string;
  read_cover_image_url?: string;
  features: number[];
  geo_organization: Organization;
  latitude: number;
  longitude: number;
  pincode: number;
  is_public: boolean;
  permissions: string[];
  root_org_permissions: string[];
  child_org_permissions: string[];
  instance_discount_codes: Code[];
  instance_discount_monetory_components: MonetoryComponentRead[];
  instance_tax_codes: Code[];
  instance_tax_monetory_components: MonetoryComponentRead[];
  discount_codes: Code[];
}
