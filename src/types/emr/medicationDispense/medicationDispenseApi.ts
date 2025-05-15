import { HttpMethod, Type } from "@/Utils/request/api";
import {
  MedicationDispenseCreate,
  MedicationDispenseRead,
} from "@/types/emr/medicationDispense/medicationDispense";

export default {
  create: {
    path: "/api/v1/patient/{patientId}/medication/dispense/",
    method: HttpMethod.POST,
    TRes: Type<MedicationDispenseRead>(),
    TBody: Type<MedicationDispenseCreate>,
  },
};
