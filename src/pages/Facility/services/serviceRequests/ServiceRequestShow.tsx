import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft /* FileText */ } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent /* CardHeader, CardTitle */,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import {
  SpecimenFromDefinitionCreate /* SpecimenRead */,
} from "@/types/emr/specimen/specimen";
import specimenApi from "@/types/emr/specimen/specimenApi";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

import { PatientHeader } from "./components/PatientHeader";
import { ServiceRequestDetails } from "./components/ServiceRequestDetails";
import { SpecimenForm } from "./components/SpecimenForm";
import { SpecimenWorkflowCard } from "./components/SpecimenWorkflowCard";

interface ServiceRequestShowProps {
  facilityId: string;
  serviceRequestId: string;
  _locationId?: string;
  _serviceId?: string;
}

export default function ServiceRequestShow({
  facilityId,
  serviceRequestId,
  _locationId,
  _serviceId,
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

  const assignedSpecimenIds = new Set<string>();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 p-4 max-w-6xl mx-auto">
        <div className="space-y-6">
          <Button
            variant="outline"
            className="mb-4"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </Button>

          <PatientHeader
            patient={request.encounter.patient}
            facilityId={facilityId}
          />

          <ServiceRequestDetails
            facilityId={facilityId}
            request={request}
            activityDefinition={activityDefinition}
          />

          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Specimens</h2>
            {specimenRequirements.length > 0 ? (
              specimenRequirements.map((requirement) => {
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
              })
            ) : (
              <Card>
                <CardContent className="p-4 text-center text-gray-500">
                  No specific specimen requirements defined for this request.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Sheet
          open={selectedSpecimenDefinition !== null}
          onOpenChange={(open) => !open && setSelectedSpecimenDefinition(null)}
        >
          <SheetContent className="w-full sm:max-w-[800px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>
                Collect Specimen: {selectedSpecimenDefinition?.title}
              </SheetTitle>
            </SheetHeader>
            {selectedSpecimenDefinition && (
              <SpecimenForm
                specimenDefinition={selectedSpecimenDefinition}
                onSubmit={handleAddSpecimen}
                onCancel={() => setSelectedSpecimenDefinition(null)}
              />
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
