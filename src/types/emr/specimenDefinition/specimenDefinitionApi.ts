import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  SpecimenDefinitionRead,
  SpecimenDefinitionRequest,
} from "./specimenDefinition";

export default {
  listSpecimenDefinitions: {
    path: "/api/v1/facility/{facilityId}/specimen_definition/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<SpecimenDefinitionRead>>(),
  },
  retrieveSpecimenDefinition: {
    path: "/api/v1/facility/{facilityId}/specimen_definition/{specimenDefinitionId}/",
    method: HttpMethod.GET,
    TRes: Type<SpecimenDefinitionRead>(),
  },
  updateSpecimenDefinition: {
    path: "/api/v1/facility/{facilityId}/specimen_definition/{specimenDefinitionId}/",
    method: HttpMethod.PUT,
    TRes: Type<SpecimenDefinitionRead>(),
    TBody: Type<SpecimenDefinitionRequest>(),
  },
  createSpecimenDefinition: {
    path: "/api/v1/facility/{facilityId}/specimen_definition/",
    method: HttpMethod.POST,
    TRes: Type<SpecimenDefinitionRead>(),
    TBody: Type<SpecimenDefinitionRequest>(),
  },
};
