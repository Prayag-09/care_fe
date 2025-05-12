import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { Code } from "@/types/base/code/code";
import { MonetaryComponentRead } from "@/types/base/monetaryComponent/monetaryComponent";

import { FacilityData } from "./facility";

export default {
  getAllFacilities: {
    path: "/api/v1/getallfacilities/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<FacilityData>>(),
  },
  deleteFacility: {
    path: "/api/v1/facility/{id}/",
    method: HttpMethod.DELETE,
    TRes: Type<Record<string, never>>(),
    TBody: Type<void>(),
  },
  getFacility: {
    path: "/api/v1/facility/{id}/",
    method: HttpMethod.GET,
    TRes: Type<FacilityData>(),
  },
  updateMonetaryComponents: {
    path: "/api/v1/facility/{facilityId}/set_monetary_codes/",
    method: HttpMethod.POST,
    TRes: Type<FacilityData>(),
    TBody: Type<{
      discount_codes: Code[];
      discount_monetary_components: MonetaryComponentRead[];
    }>(),
  },
} as const;
