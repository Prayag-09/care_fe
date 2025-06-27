import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

import { Patient } from "./patient";

export default {
  listPatient: {
    path: "/api/v1/patient/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<Patient>>(),
  },
  getPatient: {
    path: "/api/v1/patient/{id}/",
    method: HttpMethod.GET,
    TBody: Type<Patient>(),
    TRes: Type<Patient>(),
  },
  searchRetrieve: {
    path: "/api/v1/patient/search_retrieve/",
    method: HttpMethod.POST,
    TRes: Type<Patient>(),
    TBody: Type<{
      phone_number: string;
      year_of_birth: string;
      partial_id: string;
    }>(),
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
