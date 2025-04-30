import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import { SpecimenFromDefinitionCreate } from "@/types/emr/specimen/specimen";
import specimenApi from "@/types/emr/specimen/specimenApi";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

import { DiagnosticReportForm } from "./components/DiagnosticReportForm";
import { DiagnosticReportReview } from "./components/DiagnosticReportReview";
import { PatientHeader } from "./components/PatientHeader";
import { ServiceRequestDetails } from "./components/ServiceRequestDetails";
import { SpecimenForm } from "./components/SpecimenForm";
import { SpecimenWorkflowCard } from "./components/SpecimenWorkflowCard";

interface ServiceRequestShowProps {
  facilityId: string;
  serviceRequestId: string;
  locationId?: string;
  serviceId?: string;
}

export default function ServiceRequestShow({
  facilityId,
  serviceRequestId,
  locationId,
  serviceId,
}: ServiceRequestShowProps) {
  const [selectedSpecimenDefinition, setSelectedSpecimenDefinition] =
    useState<SpecimenDefinitionRead | null>(null);

  const queryClient = useQueryClient();

  const { data: request, isLoading: isLoadingRequest } = useQuery({
    queryKey: ["serviceRequest", serviceRequestId],
    queryFn: query(serviceRequestApi.retrieveServiceRequest, {
      pathParams: {
        facilityId: facilityId,
        serviceRequestId: serviceRequestId,
      },
    }),
  });

  const activityDefinitionId = request?.activity_definition?.id;

  const { data: activityDefinition, isLoading: isLoadingActivityDefinition } =
    useQuery({
      queryKey: ["activityDefinition", activityDefinitionId],
      queryFn: query(activityDefinitionApi.retrieveActivityDefinition, {
        pathParams: {
          facilityId: facilityId,
          activityDefinitionId: activityDefinitionId || "",
        },
      }),
      enabled: !!activityDefinitionId,
    });

  const { mutate: createSpecimen } = useMutation({
    mutationFn: mutate(specimenApi.createSpecimenFromDefinition, {
      pathParams: {
        facilityId,
        serviceRequestId,
      },
    }),
    onSuccess: () => {
      toast.success("Specimen collected successfully");
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", serviceRequestId],
      });
      setSelectedSpecimenDefinition(null);
    },
    onError: (err: any) => {
      toast.error(
        `Failed to collect specimen: ${err.message || "Unknown error"}`,
      );
    },
  });

  const handleAddSpecimen = (specimen: SpecimenFromDefinitionCreate) => {
    createSpecimen(specimen);
  };

  if (
    isLoadingRequest ||
    (!!activityDefinitionId && isLoadingActivityDefinition)
  ) {
    return (
      <div className="p-4 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!request || !activityDefinition) {
    return (
      <div className="p-4">
        Error loading service request or activity definition details.
      </div>
    );
  }

  const specimenRequirements = activityDefinition.specimen_requirements ?? [];
  const observationRequirements =
    activityDefinition.observation_result_requirements ?? [];
  const diagnosticReports = request.diagnostic_reports || [];

  const assignedSpecimenIds = new Set<string>();
  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      <div className="flex-1 p-4 max-w-6xl mx-auto">
        <div className="space-y-6">
          {locationId && serviceId ? (
            <Button
              variant="link"
              className="underline underline-offset-2 text-gray-950 font-semibold pl-0"
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/services/${serviceId}/requests/locations/${locationId}`,
                )
              }
            >
              <CareIcon icon="l-arrow-left" className="mr-2 size-4" />
              Back
            </Button>
          ) : (
            <Button
              variant="link"
              className="underline underline-offset-2 text-gray-950 font-semibold pl-0 cursor-pointer"
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/patient/${request.encounter.patient.id}/encounter/${request.encounter.id}/service_requests`,
                )
              }
            >
              <ArrowLeftIcon className="size-4" />
              Back to encounter
            </Button>
          )}

          <div className="px-2">
            <PatientHeader
              patient={request.encounter.patient}
              facilityId={facilityId}
            />
          </div>

          <ServiceRequestDetails
            facilityId={facilityId}
            request={request}
            activityDefinition={activityDefinition}
          />
          {specimenRequirements.length > 0 && !selectedSpecimenDefinition && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Specimens</h2>
              {specimenRequirements.map((requirement) => {
                const allMatchingForThisDefId = request.specimens.filter(
                  (spec) => spec.specimen_definition?.id === requirement.id,
                );

                const collectedSpecimen = allMatchingForThisDefId.find(
                  (spec) => !assignedSpecimenIds.has(spec.id),
                );

                if (collectedSpecimen) {
                  assignedSpecimenIds.add(collectedSpecimen.id);
                }

                return (
                  <SpecimenWorkflowCard
                    key={requirement.id}
                    facilityId={facilityId}
                    serviceRequestId={serviceRequestId}
                    requirement={requirement}
                    collectedSpecimen={collectedSpecimen}
                    onCollect={() => setSelectedSpecimenDefinition(requirement)}
                  />
                );
              })}
            </div>
          )}

          {selectedSpecimenDefinition && (
            <Card className="shadow-lg border-t-4 border-t-primary">
              <CardHeader className="pb-0 flex flex-row justify-between items-center">
                <CardTitle>
                  Collect Specimen: {selectedSpecimenDefinition?.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedSpecimenDefinition(null)}
                >
                  <CareIcon icon="l-arrow-left" className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="py-4">
                <SpecimenForm
                  specimenDefinition={selectedSpecimenDefinition}
                  onSubmit={handleAddSpecimen}
                  onCancel={() => setSelectedSpecimenDefinition(null)}
                />
              </CardContent>
            </Card>
          )}

          {specimenRequirements.length === 0 && !selectedSpecimenDefinition && (
            <Card>
              <CardContent className="p-4 text-center text-gray-500">
                No specific specimen requirements defined for this request.
              </CardContent>
            </Card>
          )}

          {observationRequirements.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Test Results</h2>
              <DiagnosticReportForm
                facilityId={facilityId}
                serviceRequestId={serviceRequestId}
                observationDefinitions={observationRequirements}
                diagnosticReports={diagnosticReports}
              />
            </div>
          )}

          {diagnosticReports.length > 0 && (
            <DiagnosticReportReview
              facilityId={facilityId}
              serviceRequestId={serviceRequestId}
              diagnosticReports={diagnosticReports}
            />
          )}
        </div>
      </div>
    </div>
  );
}
