// AI Warning: This file is not complete
import { HttpMethod, Type } from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";

// Assuming ObservationRead and ObservationCreate types exist
import { ObservationCreate, ObservationRead } from "./observation";

// Create this file/types

export default {
  // Placeholder: List observations (likely filtered by request or specimen)
  listObservations: {
    path: "/api/v1/facility/{facilityId}/observation/", // Adjust path as needed
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<ObservationRead>>(),
    // Add query params type TQuery if needed (e.g., for serviceRequestId)
  },
  // Placeholder: Retrieve a single observation
  retrieveObservation: {
    path: "/api/v1/facility/{facilityId}/observation/{observationId}/",
    method: HttpMethod.GET,
    TRes: Type<ObservationRead>(),
  },
  // Placeholder: Create an observation
  createObservation: {
    path: "/api/v1/facility/{facilityId}/observation/", // Adjust path as needed
    method: HttpMethod.POST,
    TRes: Type<ObservationRead>(),
    TBody: Type<ObservationCreate>(), // Define ObservationCreate type
  },
  // Placeholder: Update an observation
  updateObservation: {
    path: "/api/v1/facility/{facilityId}/observation/{observationId}/",
    method: HttpMethod.PATCH, // or PUT
    TRes: Type<ObservationRead>(),
    TBody: Type<Partial<ObservationCreate>>(), // Allow partial updates
  },
};
