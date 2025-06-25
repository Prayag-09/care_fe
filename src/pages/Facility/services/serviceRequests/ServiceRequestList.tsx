import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ScanQrCode, X } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";
import SpecimenIDScanDialog from "@/components/Scan/SpecimenIDScanDialog";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  Priority,
  SERVICE_REQUEST_PRIORITY_COLORS,
  SERVICE_REQUEST_STATUS_COLORS,
  type ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import locationApi from "@/types/location/locationApi";

function EmptyState() {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <CareIcon icon="l-folder-open" className="size-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">
        {t("no_service_requests_found")}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {t("adjust_service_request_filters")}
      </p>
    </Card>
  );
}

function ServiceRequestCard({
  request,
  facilityId,
  locationId,
}: {
  request: ServiceRequestReadSpec;
  facilityId: string;
  locationId: string;
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2">
              <div className="font-semibold text-gray-900">
                {request.encounter.patient.name}
              </div>
              <div className="text-xs text-gray-500">
                {request.encounter.patient.id}
              </div>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={SERVICE_REQUEST_STATUS_COLORS[request.status]}>
                {t(request.status)}
              </Badge>
              <Badge
                variant={SERVICE_REQUEST_PRIORITY_COLORS[request.priority]}
              >
                {t(request.priority)}
              </Badge>
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
                `/facility/${facilityId}/locations/${locationId}/service_requests/${request.id}`,
              )
            }
          >
            <CareIcon icon="l-edit" />
            {t("see_details")}
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

function ServiceRequestTable({
  requests,
  facilityId,
  locationId,
}: {
  requests: ServiceRequestReadSpec[];
  facilityId: string;
  locationId: string;
}) {
  const { t } = useTranslation();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow className="divide-gray-200">
            <TableHead>{t("patient_name")}</TableHead>
            <TableHead>{t("service_type")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("priority")}</TableHead>
            <TableHead>{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {requests.map((request) => (
            <TableRow key={request.id} className="divide-x divide-gray-200">
              <TableCell className="font-medium">
                <div className="font-semibold text-gray-900">
                  {request.encounter.patient.name}
                </div>
                <div className="text-xs text-gray-500">
                  {request.encounter.patient.id}
                </div>
              </TableCell>
              <TableCell>{request.title}</TableCell>
              <TableCell>
                <Badge variant={SERVICE_REQUEST_STATUS_COLORS[request.status]}>
                  {t(request.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={SERVICE_REQUEST_PRIORITY_COLORS[request.priority]}
                >
                  {t(request.priority)}
                </Badge>
              </TableCell>
              <TableCell className="text-left">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(
                      `/facility/${facilityId}/locations/${locationId}/service_requests/${request.id}`,
                    )
                  }
                >
                  <CareIcon icon="l-edit" />
                  {t("see_details")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function FilterSelect({
  value,
  onValueChange,
  options,
  isStatus,
  onClear,
}: {
  value: string;
  onValueChange: (value: string | undefined) => void;
  options: string[];
  isStatus?: boolean;
  onClear: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex overflow-hidden rounded-lg border">
      <Select
        value={value}
        onValueChange={(newValue) => onValueChange(newValue || undefined)}
      >
        <SelectTrigger className="border-0 hover:bg-transparent focus:ring-0 focus:ring-offset-0">
          <div className="flex items-center gap-2">
            <CareIcon icon="l-filter" className="size-4" />
            {!value ? null : (
              <>
                <span>{isStatus ? "Status" : "Priority"}</span>
                {isStatus && <span className="text-gray-500">is</span>}
                <span>{t(value)}</span>
              </>
            )}
            {!value && (
              <span className="text-gray-500">
                {isStatus ? "Status" : "Priority"}
              </span>
            )}
          </div>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {t(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-auto border-l px-2 hover:bg-transparent"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}

export default function ServiceRequestList({
  facilityId,
  locationId,
}: {
  facilityId: string;
  locationId: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });
  const [isBarcodeOpen, setBarcodeOpen] = useState(false);

  const allStatuses = Object.values(Status);
  const [visibleTabs, setVisibleTabs] = useState<Status[]>([
    Status.active,
    Status.on_hold,
    Status.completed,
    Status.draft,
  ]);
  const [dropdownItems, setDropdownItems] = useState<Status[]>(
    allStatuses.filter((status) => !visibleTabs.includes(status)),
  );

  const handleDropdownSelect = (value: Status) => {
    const lastVisibleTab = visibleTabs[visibleTabs.length - 1];
    const newVisibleTabs = [...visibleTabs.slice(0, -1), value];
    const newDropdownItems = [
      ...dropdownItems.filter((item) => item !== value),
      lastVisibleTab,
    ];

    setVisibleTabs(newVisibleTabs);
    setDropdownItems(newDropdownItems);
    updateQuery({ status: value });
  };

  const { data: location } = useQuery({
    queryKey: ["location", facilityId, locationId],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id: locationId },
    }),
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["serviceRequests", facilityId, locationId, qParams],
    queryFn: query.debounced(serviceRequestApi.listServiceRequest, {
      pathParams: { facilityId },
      queryParams: {
        location: locationId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        title: qParams.search,
        status: qParams.status,
        priority: qParams.priority,
      },
    }),
  });

  const serviceRequests = response?.results || [];

  const handleClearPriority = () => {
    updateQuery({ priority: undefined });
  };

  return (
    <Page title={t("service_requests")} hideTitleOnPage>
      <SpecimenIDScanDialog
        open={isBarcodeOpen}
        onOpenChange={setBarcodeOpen}
        facilityId={facilityId}
        locationId={locationId}
      />
      <div className="container mx-auto pb-8">
        <div className="mb-8">
          <div className="mb-4">
            <p className="text-sm text-gray-600">{location?.name}</p>
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
              <h1 className="text-2xl font-semibold text-gray-900">
                {t("service_requests")}
              </h1>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setBarcodeOpen(true)}
              >
                <ScanQrCode className="size-4" />
                {t("scan_qr")}
              </Button>
            </div>
          </div>
          <div className="w-full mb-4">
            <Tabs
              value={qParams.status || Status.active}
              onValueChange={(value) => updateQuery({ status: value })}
            >
              <TabsList className="w-full justify-evenly sm:justify-start border-b rounded-none bg-transparent p-0 h-auto overflow-x-auto">
                {visibleTabs.map((statusValue) => (
                  <TabsTrigger
                    key={statusValue}
                    value={statusValue}
                    className="border-b-3 px-1.5 sm:px-2.5 py-2 text-gray-600 font-semibold hover:text-gray-900 data-[state=active]:border-b-primary-700 data-[state=active]:text-primary-800 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
                  >
                    {t(statusValue)}
                  </TabsTrigger>
                ))}
                {dropdownItems.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="text-gray-500 font-semibold hover:text-gray-900 hover:bg-transparent pb-2.5 px-2.5"
                      >
                        {t("more")}
                        <ChevronDown />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {dropdownItems.map((statusValue) => (
                        <DropdownMenuItem
                          key={statusValue}
                          onClick={() => handleDropdownSelect(statusValue)}
                          className="text-gray-950 font-medium text-sm"
                        >
                          {t(statusValue)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <CareIcon icon="l-search" className="size-5" />
                </span>
                <Input
                  placeholder={t("search_service_requests")}
                  value={qParams.search || ""}
                  onChange={(e) =>
                    updateQuery({ search: e.target.value || undefined })
                  }
                  className="w-full md:w-[300px] pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.priority || ""}
                  onValueChange={(value) => updateQuery({ priority: value })}
                  options={Object.values(Priority)}
                  onClear={handleClearPriority}
                />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:hidden">
              <CardGridSkeleton count={6} />
            </div>
            <div className="hidden md:block">
              <TableSkeleton count={5} />
            </div>
          </>
        ) : serviceRequests.length === 0 && !isLoading ? (
          <EmptyState />
        ) : serviceRequests.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Mobile View */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:hidden">
              {serviceRequests.map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                  facilityId={facilityId}
                  locationId={locationId}
                />
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block">
              <ServiceRequestTable
                requests={serviceRequests}
                facilityId={facilityId}
                locationId={locationId}
              />
            </div>
          </>
        )}

        <div className="mt-8 flex justify-center">
          <Pagination totalCount={response?.count || 0} />
        </div>
      </div>
    </Page>
  );
}
