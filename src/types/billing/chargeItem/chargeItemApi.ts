import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { ChargeItemBase, ChargeItemCreate, ChargeItemRead } from "./chargeItem";

export default {
  listChargeItem: {
    path: "/api/v1/facility/{facilityId}/charge_item/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ChargeItemBase>>(),
  },
  retrieveChargeItem: {
    path: "/api/v1/facility/{facilityId}/charge_item/{chargeItemId}/",
    method: HttpMethod.GET,
    TRes: Type<ChargeItemRead>(),
  },
  createChargeItem: {
    path: "/api/v1/facility/{facilityId}/charge_item/",
    method: HttpMethod.POST,
    TRes: Type<ChargeItemRead>(),
    TBody: Type<ChargeItemCreate>(),
  },
  updateChargeItem: {
    path: "/api/v1/facility/{facilityId}/charge_item/{chargeItemId}/",
    method: HttpMethod.PUT,
    TRes: Type<ChargeItemRead>(),
    TBody: Type<ChargeItemCreate>(),
  },
  upsertChargeItem: {
    path: "/api/v1/facility/{facilityId}/charge_item/upsert/",
    method: HttpMethod.POST,
    TRes: Type<ChargeItemRead>(),
    TBody: Type<ChargeItemCreate[]>,
  },
} as const;
