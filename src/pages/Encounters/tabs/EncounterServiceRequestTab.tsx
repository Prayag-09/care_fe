import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Card, CardContent } from "@/components/ui/card";
import { FilterTabs } from "@/components/ui/filter-tabs";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import ServiceRequestTable from "@/components/ServiceRequest/ServiceRequestTable";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";
import { Status } from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";

export const EncounterServiceRequestTab = ({
  encounter,
}: EncounterTabProps) => {
  const { t } = useTranslation();
  const {
    qParams,
    updateQuery,
    Pagination: Pagination,
    resultsPerPage,
  } = useFilters({
    limit: 20,
    disableCache: true,
  });

  const facilityId = encounter.facility.id;

  const { data, isLoading } = useQuery({
    queryKey: ["serviceRequests", facilityId, encounter.id, qParams],
    queryFn: query(serviceRequestApi.listServiceRequest, {
      pathParams: { facilityId },
      queryParams: {
        encounter: encounter.id,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        limit: resultsPerPage,
        status: qParams.status,
      },
    }),
  });

  return (
    <div className="space-y-6">
      {/* Status Filter */}
      <div className="flex justify-start">
        <FilterTabs
          value={qParams.status || ""}
          onValueChange={(value) => updateQuery({ status: value })}
          options={Object.values(Status)}
          variant="background"
          showAllOption={true}
          allOptionLabel="all_statuses"
          showMoreDropdown={true}
          maxVisibleTabs={3}
          defaultVisibleOptions={[
            Status.active,
            Status.completed,
            Status.draft,
          ]}
          className="w-auto"
        />
      </div>

      {isLoading ? (
        <TableSkeleton count={6} />
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {data?.results?.length ? (
                <ServiceRequestTable
                  requests={data.results}
                  facilityId={facilityId}
                  showPatientInfo={false}
                />
              ) : (
                <div className="p-6 text-center text-gray-500">
                  {t("no_service_requests_found")}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Pagination totalCount={data?.count || 0} />
          </div>
        </div>
      )}
    </div>
  );
};
