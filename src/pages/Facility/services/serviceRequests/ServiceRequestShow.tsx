import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import {
  ArrowLeft,
  FileText,
  FoldVertical,
  UnfoldVertical,
} from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import { SPECIMEN_STATUS_STYLES } from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import type { SpecimenFromDefinitionCreate } from "@/types/emr/specimen/specimen";
import specimenApi from "@/types/emr/specimen/specimenApi";

import { SpecimenDefinition } from "./components/SpecimenDefinition";

export default function ServiceRequestShow({
  facilityId,
  serviceRequestId,
  _locationId,
  _serviceId,
}: {
  facilityId: string;
  serviceRequestId: string;
  _locationId?: string;
  _serviceId?: string;
}) {
  const [isSpecimenExpanded, setIsSpecimenExpanded] = useState(false);
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

  const { data: activityDefinition, isLoading: isLoadingActivityDefinition } =
    useQuery({
      queryKey: ["activityDefinition", request?.activity_definition.id],
      queryFn: query(activityDefinitionApi.retrieveActivityDefinition, {
        pathParams: {
          facilityId: facilityId,
          activityDefinitionId: request?.activity_definition.id || "",
        },
      }),
      enabled: !!request?.activity_definition.id,
    });

  const { mutate: createSpecimen } = useMutation({
    mutationFn: mutate(specimenApi.createSpecimenFromDefinition, {
      pathParams: {
        facilityId,
        serviceRequestId,
      },
    }),
    onSuccess: () => {
      toast.success("Specimen created successfully");
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", serviceRequestId],
      });
    },
  });

  const handleAddSpecimen = (specimen: SpecimenFromDefinitionCreate) => {
    createSpecimen(specimen);
  };

  const handleRemoveSpecimen = (specimenId: string) => {
    // TODO: Implement specimen removal
    console.log("Remove specimen", specimenId);
  };

  if (isLoadingRequest || isLoadingActivityDefinition) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!request || !activityDefinition) {
    return null;
  }

  const specimenRequirements = activityDefinition.specimen_requirements;

  const patient = request.encounter.patient;
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 p-2 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column - Patient Info and Tests */}
          <div className="md:col-span-2 space-y-6">
            {/* Back Button */}
            <div>
              <Button variant="outline">
                <ArrowLeft className="h-5 w-5" />
                Back
              </Button>
            </div>

            {/* Patient Information */}
            <div className="p-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Patient</p>
                <Link
                  href={`/facility/${facilityId}/patient/${patient.id}`}
                  className="text-gray-950 font-medium flex items-start underline gap-0.5"
                  id="patient-details"
                  data-cy="patient-details-Button"
                >
                  {patient.name}
                  <CareIcon
                    icon="l-external-link-alt"
                    className="size-3.5 opacity-50 mt-1"
                  />
                </Link>
              </div>
              <div>
                <p className="text-xs text-gray-700 mb-1">Age/Sex</p>
                <p className="font-medium text-gray-950">
                  {patient.age && `${patient.age}/`}
                  {t(patient.gender)}
                </p>
              </div>
            </div>
            <div className="bg-gray-100 border-gray-200 border rounded-md p-2">
              {/* Reference Number */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {request.title}
                  </span>
                </div>
                <Badge
                  className={cn(
                    "bg-[#ffedd5] text-[#7c2d12] hover:bg-[#ffedd5] font-normal text-xs rounded-md",
                    SPECIMEN_STATUS_STYLES[request.status],
                  )}
                >
                  {t(request.status)}
                </Badge>
              </div>
              {/* Service Type */}
              <div className="bg-white rounded-md shadow-sm p-6">
                <div className=" grid grid-cols-2 gap-1">
                  <div className="mb-4">
                    <p className="text-xs text-gray-700 mb-1">Service Type</p>
                    <p className="font-medium text-gray-950">
                      {activityDefinition.title}
                    </p>
                  </div>
                  <div className="">
                    <p className="text-xs text-gray-700 mb-1">Requested by</p>
                    <p className="font-medium text-gray-950">
                      {request.created_by && formatName(request.created_by)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-700 mb-1">Priority</p>
                    <Badge
                      className="font-medium text-gray-950"
                      variant="secondary"
                    >
                      {t(request.priority)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mt-4">
              <Collapsible
                open={isSpecimenExpanded}
                onOpenChange={setIsSpecimenExpanded}
                className="border border-gray-400 shadow-sm rounded-md overflow-hidden"
              >
                <CollapsibleTrigger
                  asChild
                  className="bg-white cursor-pointer h-10 border-gray-400"
                >
                  <div className="flex items-center justify-between px-1 bg-white">
                    <div className="flex items-center">
                      <FileText className="size-4 text-gray-700 mr-3" />
                      <span className="text-gray-950 text-sm font-semibold">
                        Collect Specimen
                      </span>
                    </div>
                    <div className="flex items-center border border-gray-400 bg-gray-100 rounded-sm p-1">
                      {isSpecimenExpanded ? (
                        <FoldVertical className="size-4" />
                      ) : (
                        <UnfoldVertical className="size-4" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="bg-gray-50 p-2 border-t border-gray-200">
                  <p className="font-medium text-gray-950 mb-2 text-sm">
                    Specimen Definitions
                  </p>

                  {/* Specimen Definition Cards */}
                  <div className="space-y-2">
                    {specimenRequirements.map((requirement) => {
                      const matchingSpecimens = request.specimens.filter(
                        (specimen) =>
                          specimen.specimen_type?.code ===
                          requirement.type_collected?.code,
                      );

                      return (
                        <SpecimenDefinition
                          key={requirement.id}
                          specimenDefinition={requirement}
                          onAddSpecimen={handleAddSpecimen}
                          onRemoveSpecimen={handleRemoveSpecimen}
                          specimens={matchingSpecimens}
                        />
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
