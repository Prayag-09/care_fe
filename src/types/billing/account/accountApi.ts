import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { AccountBase, AccountCreate, AccountRead } from "./Account";

export default {
  listAccount: {
    path: "/api/v1/{facilityId}/account/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<AccountBase>>(),
  },
  retrieveAccount: {
    path: "/api/v1/{facilityId}/account/{accountId}/",
    method: HttpMethod.GET,
    TRes: Type<AccountRead>(),
  },
  createAccount: {
    path: "/api/v1/{facilityId}/account/",
    method: HttpMethod.POST,
    TRes: Type<AccountRead>(),
    TBody: Type<AccountCreate>(),
  },
  updateAccount: {
    path: "/api/v1/{facilityId}/account/{accountId}/",
    method: HttpMethod.PUT,
    TRes: Type<AccountRead>(),
    TBody: Type<AccountBase>(),
  },
} as const;
