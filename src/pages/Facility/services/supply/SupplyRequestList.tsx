import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { EmptyState } from "@/components/definition-list/EmptyState";
import { FilterSelect } from "@/components/definition-list/FilterSelect";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  SupplyRequestPriority,
  SupplyRequestRead,
  SupplyRequestStatus,
} from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  draft: "bg-gray-100 text-gray-700",
  on_hold: "bg-amber-100 text-amber-700",
  unknown: "bg-gray-100 text-gray-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  routine: "bg-blue-100 text-blue-700",
  urgent: "bg-red-100 text-red-700",
  asap: "bg-amber-100 text-amber-700",
  stat: "bg-purple-100 text-purple-700",
};

export enum SupplyRequestTab {
  INCOMING = "incoming",
  REQUESTED = "requested",
}

interface Props {
  facilityId: string;
  locationId: string;
  tab: SupplyRequestTab;
}

export default function SupplyRequestList({
  facilityId,
  locationId,
  tab = SupplyRequestTab.INCOMING,
}: Props) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["supplyRequests", qParams, tab],
    queryFn: query.debounced(supplyRequestApi.listSupplyRequest, {
      queryParams: {
        facility: facilityId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        search: qParams.search,
        status: qParams.status,
        priority: qParams.priority,
        deliver_from:
          tab === SupplyRequestTab.INCOMING ? locationId : undefined,
        deliver_to: tab === SupplyRequestTab.REQUESTED ? locationId : undefined,
      },
    }),
  });

  const requests = response?.results || [];

  return (
    <Page title={t("supply_requests")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("supply_requests")}
            </h1>
            <Button
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/supply_requests/new`,
                )
              }
            >
              <CareIcon icon="l-plus" className="mr-2 size-4" />
              {t("create_supply_request")}
            </Button>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder={t("search_supply_requests")}
                value={qParams.search}
                onChange={(e) => updateQuery({ search: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.status || ""}
                  onValueChange={(value) => updateQuery({ status: value })}
                  options={Object.values(SupplyRequestStatus)}
                  label="status"
                  onClear={() => updateQuery({ status: undefined })}
                />
              </div>
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.priority || ""}
                  onValueChange={(value) => updateQuery({ priority: value })}
                  options={Object.values(SupplyRequestPriority)}
                  label="priority"
                  onClear={() => updateQuery({ priority: undefined })}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-row justify-between items-center gap-2">
            <Tabs
              value={tab}
              onValueChange={(value) =>
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/supply_requests/${value}`,
                )
              }
              className="max-sm:hidden"
            >
              <TabsList>
                <TabsTrigger value="incoming">{t("incoming")}</TabsTrigger>
                <TabsTrigger value="requested">{t("requested")}</TabsTrigger>
              </TabsList>
            </Tabs>

            <Select
              value={tab}
              onValueChange={(value) =>
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/supply_requests/${value}`,
                )
              }
            >
              <SelectTrigger className="sm:hidden">
                <SelectValue placeholder={t("filter_by_delivery")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="incoming">{t("incoming")}</SelectItem>
                  <SelectItem value="requested">{t("requested")}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton count={5} />
        ) : requests.length === 0 ? (
          <EmptyState
            title={t("no_supply_requests_found")}
            description={t("no_supply_requests_found_description")}
            icon="l-box"
          />
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("item")}</TableHead>
                    <TableHead>{t("quantity")}</TableHead>
                    <TableHead>{t("deliver_from")}</TableHead>
                    <TableHead>{t("deliver_to")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("priority")}</TableHead>
                    <TableHead className="w-[100px]">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request: SupplyRequestRead) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.item.name}</TableCell>
                      <TableCell>{request.quantity}</TableCell>
                      <TableCell>
                        {request.deliver_from?.name || t("not_specified")}
                      </TableCell>
                      <TableCell>{request.deliver_to.name}</TableCell>
                      <TableCell>
                        <Badge
                          className={STATUS_COLORS[request.status]}
                          variant="secondary"
                        >
                          {t(request.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={PRIORITY_COLORS[request.priority]}
                          variant="secondary"
                        >
                          {t(request.priority)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/facility/${facilityId}/locations/${locationId}/supply_requests/${request.id}`,
                            )
                          }
                        >
                          <CareIcon icon="l-eye" className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4">
              <Pagination totalCount={response?.count || 0} />
            </div>
          </>
        )}
      </div>
    </Page>
  );
}
