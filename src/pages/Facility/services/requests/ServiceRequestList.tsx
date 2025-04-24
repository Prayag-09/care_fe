import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Page from "@/components/Common/Page";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  Priority,
  type ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
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
  [Priority.routine]: "bg-gray-100 text-gray-700",
  [Priority.urgent]: "bg-yellow-100 text-yellow-700",
  [Priority.asap]: "bg-orange-100 text-orange-700",
  [Priority.stat]: "bg-red-100 text-red-700",
};

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex h-[200px] items-center justify-center text-gray-500">
      <div className="text-center">
        <CareIcon icon="l-folder-open" className="mx-auto mb-2 size-8" />
        <p>{t("no_service_requests_found")}</p>
        <p className="text-sm">{t("try_different_search")}</p>
      </div>
    </div>
  );
}

function ServiceRequestCard({
  request,
  facilityId,
}: {
  request: ServiceRequestReadSpec;
  facilityId: string;
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_COLORS[request.status]
                }`}
              >
                {t(request.status)}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  PRIORITY_COLORS[request.priority]
                }`}
              >
                {t(request.priority)}
              </span>
            </div>
            <h3 className="font-medium text-gray-900">{request.title}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {request.note || t("no_notes")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(
                `/facility/${facilityId}/services/requests/${request.id}`,
              )
            }
          >
            {t("view_details")}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <CareIcon icon="l-calender" className="size-4" />
            <span>{request.occurance || t("no_occurrence_set")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ServiceRequestList({
  facilityId,
  serviceId,
  locationId,
}: {
  facilityId: string;
  serviceId: string;
  locationId: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });
  console.log(serviceId, locationId);
  const { data: response, isLoading } = useQuery({
    queryKey: ["serviceRequests", qParams],
    queryFn: query(serviceRequestApi.listServiceRequest, {
      pathParams: { facilityId },
      queryParams: {
        location: locationId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        search: qParams.search,
        status: qParams.status,
        priority: qParams.priority,
      },
    }),
  });

  const serviceRequests = response?.results || [];

  return (
    <Page title={t("service_requests")}>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {t("service_requests")}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {t("manage_service_requests")}
              </p>
            </div>
            <Button
              onClick={() =>
                navigate(`/facility/${facilityId}/services/requests/new`)
              }
            >
              <CareIcon icon="l-plus" className="mr-2" />
              {t("new_service_request")}
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Input
              placeholder={t("search_service_requests")}
              value={qParams.search || ""}
              onChange={(e) =>
                updateQuery({ search: e.target.value || undefined })
              }
              className="max-w-xs flex-wrap "
            />
            <div className="flex flex-row items-center gap-4">
              <div className="min-w-40">
                <Select
                  value={qParams.status || ""}
                  onValueChange={(value) =>
                    updateQuery({ status: value || undefined })
                  }
                >
                  <SelectTrigger className="">
                    <SelectValue placeholder={t("filter_by_status")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Status).map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-40">
                <Select
                  value={qParams.priority || ""}
                  onValueChange={(value) =>
                    updateQuery({ priority: value || undefined })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t("filter_by_priority")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Priority).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {t(priority)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CardGridSkeleton count={6} />
          </div>
        ) : serviceRequests.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {serviceRequests.map((request) => (
              <ServiceRequestCard
                key={request.id}
                request={request}
                facilityId={facilityId}
              />
            ))}
          </div>
        )}

        {response && response.count > resultsPerPage && (
          <div className="mt-8 flex justify-center">
            <Pagination totalCount={response.count} />
          </div>
        )}
      </div>
    </Page>
  );
}
