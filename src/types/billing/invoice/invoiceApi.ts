import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { InvoiceBase, InvoiceCreate, InvoiceRead } from "./invoice";

export default {
  listInvoice: {
    path: "/api/v1/facility/{facilityId}/invoice/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<InvoiceBase>>(),
  },
  retrieveInvoice: {
    path: "/api/v1/facility/{facilityId}/invoice/{invoiceId}/",
    method: HttpMethod.GET,
    TRes: Type<InvoiceRead>(),
  },
  createInvoice: {
    path: "/api/v1/facility/{facilityId}/invoice/",
    method: HttpMethod.POST,
    TRes: Type<InvoiceRead>(),
    TBody: Type<InvoiceCreate>(),
  },
  updateInvoice: {
    path: "/api/v1/facility/{facilityId}/invoice/{invoiceId}/",
    method: HttpMethod.PUT,
    TRes: Type<InvoiceRead>(),
    TBody: Type<InvoiceCreate>(),
  },
} as const;
