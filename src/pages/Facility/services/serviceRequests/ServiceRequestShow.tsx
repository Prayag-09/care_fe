import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import query from "@/Utils/request/query";
import { Priority, Status } from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";

const STATUS_COLORS: Record<Status, string> = {
  [Status.draft]: "bg-gray-100 text-gray-700",
  [Status.active]: "bg-green-100 text-green-700",
  [Status.on_hold]: "bg-yellow-100 text-yellow-700",
  [Status.revoked]: "bg-red-100 text-red-700",
  [Status.completed]: "bg-blue-100 text-blue-700",
  [Status.entered_in_error]: "bg-red-100 text-red-700",
  [Status.ended]: "bg-gray-100 text-gray-700",
  [Status.unknown]: "bg-gray-100 text-gray-700",
};

const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.routine]: "bg-blue-100 text-blue-700",
  [Priority.urgent]: "bg-yellow-100 text-yellow-700",
  [Priority.asap]: "bg-orange-100 text-orange-700",
  [Priority.stat]: "bg-red-100 text-red-700",
};

export default function ServiceRequestShow({
  facilityId,
  serviceRequestId,
  serviceId,
  locationId,
}: {
  facilityId: string;
  serviceRequestId: string;
  serviceId?: string;
  locationId?: string;
}) {
  const { t } = useTranslation();

  const { data: request, isLoading } = useQuery({
    queryKey: ["serviceRequest", serviceRequestId],
    queryFn: query(serviceRequestApi.retrieveServiceRequest, {
      pathParams: { facilityId, serviceRequestId: serviceRequestId },
    }),
  });

  if (isLoading) {
    return (
      <Page title={t("service_request_details")}>
        <div className="container mx-auto max-w-4xl py-8">
          <TableSkeleton count={3} />
        </div>
      </Page>
    );
  }

  if (!request) {
    return <ErrorPage />;
  }

  return (
    <Page title={request.title}>
      <div className="container mx-auto max-w-4xl py-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            {locationId && serviceId ? (
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/services/${serviceId}/requests/locations/${locationId}`,
                  )
                }
              >
                <CareIcon icon="l-arrow-left" className="mr-2 size-4" />
                {t("back")}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/patient/${request.encounter.patient.id}/encounter/${request.encounter.id}/service_requests`,
                  )
                }
              >
                <CareIcon icon="l-arrow-left" className="mr-2 size-4" />
                {t("back_to_encounter")}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{request.title}</CardTitle>
                  <CardDescription>{t("request_details")}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      PRIORITY_COLORS[request.priority]
                    }`}
                  >
                    {t(request.priority)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-medium ${
                      STATUS_COLORS[request.status]
                    }`}
                  >
                    {t(request.status)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-500">
                  {t("request_id")}
                </h3>
                <p className="font-mono text-gray-900">{request.id}</p>
              </div>

              {request.code && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-500">
                    {t("service_type")}
                  </h3>
                  <p className="text-gray-900">{request.code.display}</p>
                </div>
              )}

              {request.body_site && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-500">
                    {t("specimen")}
                  </h3>
                  <p className="text-gray-900">{request.body_site.display}</p>
                </div>
              )}

              {request.note && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-500">
                    {t("notes")}
                  </h3>
                  <p className="text-gray-900">{request.note}</p>
                </div>
              )}

              {request.occurance && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-500">
                    {t("occurrence")}
                  </h3>
                  <p className="text-gray-900">{request.occurance}</p>
                </div>
              )}

              {request.patient_instruction && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-500">
                    {t("patient_instructions")}
                  </h3>
                  <p className="text-gray-900">{request.patient_instruction}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Locations */}
          <Card>
            <CardHeader>
              <CardTitle>{t("locations")}</CardTitle>
              <CardDescription>{t("service_locations")}</CardDescription>
            </CardHeader>
            <CardContent>
              {request.locations?.length === 0 ? (
                <p className="text-gray-500">{t("no_locations_assigned")}</p>
              ) : (
                <div className="space-y-4">
                  {request.locations?.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {location.name}
                        </h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(
                            `/facility/${facilityId}/location/${location.id}`,
                          )
                        }
                      >
                        <CareIcon icon="l-arrow-right" className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>{t("metadata")}</CardTitle>
              <CardDescription>{t("system_information")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-500">{t("intent")}</p>
                  <p>{t(request.intent)}</p>
                </div>
                {request.version !== undefined && (
                  <div>
                    <p className="font-medium text-gray-500">{t("version")}</p>
                    <p>{request.version}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-500">
                    {t("do_not_perform")}
                  </p>
                  <p>{request.do_not_perform ? t("yes") : t("no")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Page>
  );
}
