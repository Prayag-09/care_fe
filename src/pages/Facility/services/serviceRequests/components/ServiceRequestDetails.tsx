import { t } from "i18next";

import { Badge } from "@/components/ui/badge";

import { formatName } from "@/Utils/utils";
import { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import { ObservationDefinitionReadSpec } from "@/types/emr/observationDefinition/observationDefinition";
import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

interface ServiceRequestDetailsProps {
  facilityId: string;
  request: ServiceRequestReadSpec;
  activityDefinition: ActivityDefinitionReadSpec;
}

export function ServiceRequestDetails({
  facilityId,
  request,
  activityDefinition,
}: ServiceRequestDetailsProps) {
  const specimenRequirements = activityDefinition?.specimen_requirements ?? [];
  const observationRequirements =
    activityDefinition?.observation_result_requirements ?? [];
  console.log(facilityId);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-600">
            <div className="font-medium text-gray-600 mb-1 text-xl">
              {activityDefinition.title}
            </div>
            <div className="font-medium">Request id: {request.id}</div>
          </div>
          <div className="flex gap-2 items-center">
            {request.do_not_perform && (
              <Badge variant="destructive">Do not perform</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="gap-2 mb-4">
            <div className="text-sm text-gray-600 mb-1">Status</div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-blue-50">
                {t(request.priority)}
              </Badge>
              <Badge variant="outline" className="bg-green-50">
                {t(request.status)}
              </Badge>
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Specimen</div>
            <div className="font-sm font-normal flex flex-wrap gap-1">
              {specimenRequirements.map(
                (requirement: SpecimenDefinitionRead) => (
                  <span
                    key={requirement.id}
                    className="bg-gray-50 px-2 py-px border rounded-md"
                  >
                    {requirement.type_collected?.display}
                  </span>
                ),
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">
              Observation Definitions
            </div>
            <div className="font-sm font-normal flex flex-wrap gap-1">
              {observationRequirements.map(
                (test: ObservationDefinitionReadSpec) => (
                  <span
                    key={test.id}
                    className="bg-gray-50 px-2 py-px border rounded-md"
                  >
                    {test.title}
                  </span>
                ),
              )}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Requested by</div>
            <div className="font-medium">
              {request.created_by && formatName(request.created_by)}
            </div>
          </div>
        </div>

        {request.note && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-600 mb-1">Note:</div>
            <div className="text-sm">{request.note}</div>
          </div>
        )}
      </div>
    </div>
  );
}
