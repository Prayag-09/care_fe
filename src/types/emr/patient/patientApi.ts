import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { Patient, PatientCreate, PatientRead, PatientUpdate } from "./patient";

export default {
  addPatient: {
    path: "/api/v1/patient/",
    method: HttpMethod.POST,
    TBody: Type<PatientCreate>(),
    TRes: Type<PatientRead>(),
  },

  updatePatient: {
    path: "/api/v1/patient/{id}/",
    method: HttpMethod.PUT,
    TRes: Type<PatientRead>(),
    TBody: Type<PatientUpdate>(),
  },
  listPatient: {
    path: "/api/v1/patient/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Patient>>(),
  },
  getPatient: {
    path: "/api/v1/patient/{id}/",
    method: HttpMethod.GET,
    TRes: Type<PatientRead>(),
  },
  searchRetrieve: {
    path: "/api/v1/patient/search_retrieve/",
    method: HttpMethod.POST,
    TRes: Type<PatientRead>(),
    TBody: Type<
      Partial<{
        phone_number: string;
        year_of_birth: string;
        partial_id: string;
      }>
    >(),
  },
  // Tag-related endpoints
  setTags: {
    path: "/api/v1/patient/{external_id}/set_tags/",
    method: HttpMethod.POST,
    TRes: Type<unknown>(),
    TBody: Type<{ tags: string[] }>(),
  },
  removeTags: {
    path: "/api/v1/patient/{external_id}/remove_tags/",
    method: HttpMethod.POST,
    TRes: Type<unknown>(),
    TBody: Type<{ tags: string[] }>(),
  },
};
