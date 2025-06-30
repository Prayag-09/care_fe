import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Card, CardContent } from "@/components/ui/card";

import Pagination from "@/components/Common/Pagination";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import ServiceRequestTable from "@/components/ServiceRequest/ServiceRequestTable";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import query from "@/Utils/request/query";
import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";

export const EncounterServiceRequestTab = ({
  encounter,
}: EncounterTabProps) => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const limit = RESULTS_PER_PAGE_LIMIT;
  const facilityId = encounter.facility.id;

  const { data, isLoading } = useQuery({
    queryKey: ["serviceRequests", facilityId, encounter.id, page, limit],
    queryFn: query(serviceRequestApi.listServiceRequest, {
      pathParams: { facilityId },
      queryParams: {
        encounter: encounter.id,
        offset: (page - 1) * limit,
        limit,
      },
    }),
  });

  return (
    <div className="space-y-6">
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
            {!!(data && data.count > limit) && (
              <Pagination
                data={{ totalCount: data.count }}
                onChange={(page, _) => setPage(page)}
                defaultPerPage={limit}
                cPage={page}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
