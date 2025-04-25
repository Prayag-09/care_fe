import { Encounter } from "@/types/emr/encounter";
import { ObservationRead } from "@/types/emr/observation/observation";
import { PatientModel } from "@/types/emr/patient";
import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";
import { Code } from "@/types/questionnaire/code";
import { UserBase } from "@/types/user/user";

// Based on http://hl7.org/fhir/valueset-diagnostic-report-status.html
export enum DiagnosticReportStatus {
  REGISTERED = "registered",
  PARTIAL = "partial",
  PRELIMINARY = "preliminary",
  MODIFIED = "modified", // Alias for corrected? FHIR uses 'final', 'amended', 'corrected', 'appended'
  FINAL = "final",
  AMENDED = "amended",
  CORRECTED = "corrected",
  APPENDED = "appended",
  CANCELLED = "cancelled",
  ENTERED_IN_ERROR = "entered-in-error",
  UNKNOWN = "unknown",
}

// Basic structure based on provided JSON spec and API examples
export interface DiagnosticReportBase {
  id: string;
  status: DiagnosticReportStatus;
  // category: Code; // ValueSet: https://build.fhir.org/valueset-diagnostic-service-sections.html
  // code: Code; // ValueSet: https://build.fhir.org/valueset-report-codes.html (Fetched from SR)
  note: string | null; // Markdown comments
  conclusion: string | null; // Markdown clinical conclusion

  // References based on JSON spec (might not all be in API response/request yet)
  service_request?: { id: string }; // Required for creation based on spec
  patient?: { id: string }; // Link to Patient
  encounter?: { id: string }; // Link to Encounter
  // specimen?: { id: string }[]; // Array of Specimen IDs - Marked as "Ignored" in spec
  result?: { id: string }[]; // Array of Observation IDs
}

// Includes fields from base + audit info + potentially linked resources
// Aligned with GET response examples, adding optional fields from JSON spec
export interface DiagnosticReportRead extends DiagnosticReportBase {
  // Fields from GET examples
  meta?: Record<string, unknown>; // Example shows 'meta: {}'
  category?: Code; // Present in GET examples
  code?: Code; // Present in GET examples

  // Audit fields (assuming standard pattern)
  created_by?: UserBase;
  updated_by?: UserBase;
  created_at?: string;
  updated_at?: string;

  // Potentially populated references (if API supports embedding)
  service_request_object?: ServiceRequestReadSpec;
  patient_object?: PatientModel;
  encounter_object?: Encounter;
  // specimen_objects?: SpecimenRead[];
  result_objects?: ObservationRead[];
}

// For creating a new report via POST
// Based on POST request body example
export interface DiagnosticReportCreate
  extends Pick<DiagnosticReportBase, "status" | "note" | "conclusion"> {
  // Required based on POST example
  category: Code;
  code: Code;
  service_request: string; // ID of the service request

  // Optional fields from JSON spec (if supported by POST API)
  patient_id?: string;
  encounter_id?: string;
  result_ids?: string[];

  // Meta field from example
  meta?: Record<string, unknown>;
}

// For updating an existing report via PUT
// Based on PUT request body example
export interface DiagnosticReportUpdate
  extends Pick<DiagnosticReportBase, "status" | "note" | "conclusion"> {
  // Required based on PUT example
  category: Code;
  code: Code;

  // Optional fields from JSON spec (if supported by PUT API)
  patient_id?: string; // Can patient be changed?
  encounter_id?: string; // Can encounter be changed?
  result_ids?: string[]; // Usually results are added/updated via Observations, not directly here?

  // Meta field from example
  meta?: Record<string, unknown>;
}
