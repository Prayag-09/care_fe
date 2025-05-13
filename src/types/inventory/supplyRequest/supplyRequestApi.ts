import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  SupplyRequestBase,
  SupplyRequestCreate,
  SupplyRequestRead,
} from "@/types/inventory/supplyRequest/supplyRequest";

export default {
  listSupplyRequest: {
    path: "/api/v1/supply_request/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<SupplyRequestRead>>(),
  },
  retrieveSupplyRequest: {
    path: "/api/v1/supply_request/{supplyRequestId}/",
    method: HttpMethod.GET,
    TRes: Type<SupplyRequestRead>(),
  },
  createSupplyRequest: {
    path: "/api/v1/supply_request/",
    method: HttpMethod.POST,
    TRes: Type<SupplyRequestBase>(),
    TBody: Type<SupplyRequestCreate>(),
  },
  updateSupplyRequest: {
    path: "/api/v1/supply_request/{supplyRequestId}/",
    method: HttpMethod.PUT,
    TRes: Type<SupplyRequestBase>(),
    TBody: Type<SupplyRequestCreate>(),
  },
} as const;
