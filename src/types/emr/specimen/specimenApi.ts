import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  SpecimenBase,
  SpecimenFromDefinitionCreate,
  SpecimenRead,
} from "./specimen";

export default {
  createSpecimen: {
    path: "/api/v1/facility/{facilityId}/service_request/{serviceRequestId}/create_specimen/",
    method: HttpMethod.POST,
    TRes: Type<PaginatedResponse<SpecimenRead>>(),
    TBody: Type<SpecimenBase>(),
  },
  createSpecimenFromDefinition: {
    path: "/api/v1/facility/{facilityId}/service_request/{serviceRequestId}/create_specimen_from_definition/",
    method: HttpMethod.POST,
    TRes: Type<PaginatedResponse<SpecimenRead>>(),
    TBody: Type<SpecimenFromDefinitionCreate>(),
  },
};
