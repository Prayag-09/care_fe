import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import {
  DiagnosticReportCreate,
  DiagnosticReportRead,
  DiagnosticReportUpdate,
} from "./diagnosticReport";

export default {
  // List Diagnostic Reports
  listDiagnosticReports: {
    path: "/api/v1/facility/{facility_external_id}/diagnostic_report/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<DiagnosticReportRead>>(),
    TQuery: Type<{ limit?: number; offset?: number }>(),
  },

  // Create Diagnostic Report
  createDiagnosticReport: {
    path: "/api/v1/facility/{facility_external_id}/diagnostic_report/",
    method: HttpMethod.POST,
    TRes: Type<DiagnosticReportRead>(), // Response seems similar to Read
    TBody: Type<DiagnosticReportCreate>(),
  },

  // Retrieve Diagnostic Report
  retrieveDiagnosticReport: {
    path: "/api/v1/facility/{facility_external_id}/diagnostic_report/{external_id}/",
    method: HttpMethod.GET,
    TRes: Type<DiagnosticReportRead>(),
  },

  // Update Diagnostic Report (using PUT as per docs)
  updateDiagnosticReport: {
    path: "/api/v1/facility/{facility_external_id}/diagnostic_report/{external_id}/",
    method: HttpMethod.PUT,
    TRes: Type<DiagnosticReportRead>(),
    TBody: Type<DiagnosticReportUpdate>(),
  },

  // Note: PATCH might be more suitable for partial updates if the API supports it.
  // Note: DELETE endpoint is not specified in the provided docs.
};
