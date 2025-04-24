import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import Pagination from "@/components/Common/Pagination";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import query from "@/Utils/request/query";
import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";
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
                <Table className="w-full overflow-x-auto whitespace-nowrap">
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>{t("service_requests")}</TableHead>
                      <TableHead>{t("priority")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead className="text-right">
                        {t("action")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.results.map((request) => {
                      return (
                        <TableRow
                          key={request.id}
                          className="hover:bg-gray-50/50"
                        >
                          <TableCell className="font-medium">
                            <Link
                              href={`/facility/${facilityId}/services_requests/${request.id}`}
                              className="group flex items-start gap-1"
                            >
                              <div>{request.code?.display || "-"}</div>
                              <div className="flex items-center gap-1 text-gray-900 group-hover:text-primary-600 group-hover:underline">
                                <span>{request.id}</span>
                                <ExternalLink className="size-3 opacity-70 group-hover:opacity-100" />
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                PRIORITY_COLORS[request.priority]
                              }`}
                            >
                              {t(request.priority)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                STATUS_COLORS[request.status]
                              }`}
                            >
                              {t(request.status)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        navigate(
                                          `/facility/${facilityId}/services_requests/${request.id}`,
                                        )
                                      }
                                    >
                                      <CareIcon
                                        icon="l-eye"
                                        className="size-4"
                                      />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {t("view_details")}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
