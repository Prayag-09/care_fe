import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  MedicationDispenseCreate,
  MedicationDispenseRead,
} from "@/types/emr/medicationDispense/medicationDispense";

export default {
  create: {
    path: "/api/v1/medication/dispense/",
    method: HttpMethod.POST,
    TRes: Type<MedicationDispenseRead>(),
    TBody: Type<MedicationDispenseCreate>(),
  },
  list: {
    path: "/api/v1/medication/dispense/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<MedicationDispenseRead>>(),
  },
};
