import { FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ObservationRead } from "@/types/emr/observation/observation";
import { ObservationDefinitionReadSpec } from "@/types/emr/observationDefinition/observationDefinition";

// Import the entry component
import { TestResultEntry } from "./TestResultEntry";

interface TestResultsSectionProps {
  facilityId: string;
  serviceRequestId: string;
  patientId: string;
  observationRequirements: ObservationDefinitionReadSpec[];
  existingObservations: ObservationRead[];
  // availableSpecimens?: SpecimenRead[]; // Uncomment if needed
}

export function TestResultsSection({
  facilityId,
  serviceRequestId,
  patientId,
  observationRequirements,
  existingObservations,
  // availableSpecimens,
}: TestResultsSectionProps) {
  // Group existing observations by their definition ID for easy lookup
  const observationsMap = existingObservations.reduce<
    Record<string, ObservationRead>
  >((acc, obs) => {
    // Use observation_definition_id if available, otherwise fallback to code
    const key = obs.observation_definition?.id ?? obs.code?.code;
    if (key) {
      // TODO: Handle multiple results for the same definition (e.g., preliminary, final)
      // For now, just takes the last one encountered.
      acc[key] = obs;
    }
    return acc;
  }, {});

  // TODO: Group requirements by category/panel if applicable
  // For now, just render a flat list

  const hasRequirements =
    observationRequirements && observationRequirements.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Test Results
        </CardTitle>
        {/* TODO: Add overall status badge (e.g., Result Entered, Partial) */}
      </CardHeader>
      <CardContent>
        {hasRequirements ? (
          <div className="space-y-4">
            {observationRequirements.map((definition) => {
              const existing =
                observationsMap[definition.id] ??
                observationsMap[definition.code.code];
              // TODO: Determine which specimen this result should link to if needed
              // const relevantSpecimenId = findSpecimenForObservation(definition, availableSpecimens);
              return (
                <TestResultEntry
                  key={definition.id}
                  facilityId={facilityId}
                  serviceRequestId={serviceRequestId}
                  patientId={patientId}
                  definition={definition}
                  existingObservation={existing}
                  // specimenId={relevantSpecimenId}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No observation results defined for this service request.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
