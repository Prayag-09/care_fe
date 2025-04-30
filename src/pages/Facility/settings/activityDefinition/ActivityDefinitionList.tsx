import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

import Page from "@/components/Common/Page";
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { type ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import {
  Category,
  Status,
} from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";

const ACTIVITY_DEFINITION_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  retired: "bg-gray-100 text-gray-700",
};

function EmptyState() {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
      <div className="rounded-full bg-primary/10 p-3 mb-4">
        <CareIcon icon="l-folder-open" className="size-6 text-primary" />
      </div>
      <h3 className="text-lg font-semibold mb-1">
        {t("no_activity_definitions_found")}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {t("adjust_activity_definition_filters")}
      </p>
    </Card>
  );
}

function ActivityDefinitionCard({
  definition,
  facilityId,
}: {
  definition: ActivityDefinitionReadSpec;
  facilityId: string;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  ACTIVITY_DEFINITION_STATUS_COLORS[definition.status] ||
                  "bg-gray-100 text-gray-700"
                }
              >
                {t(definition.status)}
              </Badge>
            </div>
            <h3 className="font-medium text-gray-900">{definition.title}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {t(definition.category)}
            </p>
            <p className="mt-1 text-xs text-gray-400">{t(definition.kind)}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/activity_definitions/${definition.id}`,
                )
              }
            >
              <CareIcon icon="l-eye" className="size-4" />
              {t("view")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/activity_definitions/${definition.id}/edit`,
                )
              }
            >
              <CareIcon icon="l-pen" className="size-4" />
              {t("edit")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
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
            {value ? (
              <>
                <span>{isStatus ? t("status") : t("category")}</span>
                <span className="text-gray-500">is</span>
                <span>{t(value)}</span>
              </>
            ) : (
              <span className="text-gray-500">
                {isStatus ? t("status") : t("category")}
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

export default function ActivityDefinitionList({
  facilityId,
}: {
  facilityId: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["activityDefinitions", qParams],
    queryFn: query.debounced(activityDefinitionApi.listActivityDefinition, {
      pathParams: { facilityId },
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        title: qParams.search,
        status: qParams.status,
        category: qParams.category,
      },
    }),
  });

  const activityDefinitions = response?.results || [];

  return (
    <Page title={t("activity_definitions")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-700">
            {t("activity_definitions")}
          </h1>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">
                {t("manage_activity_definitions")}
              </p>
            </div>
            <Button
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/activity_definitions/new`,
                )
              }
            >
              <CareIcon icon="l-plus" className="mr-2" />
              {t("add_activity_definition")}
            </Button>
          </div>

          {/* Filter/Search Layout - match ServiceRequestList */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <div className="w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <CareIcon icon="l-search" className="size-5" />
                </span>
                <Input
                  placeholder={t("search_activity_definitions")}
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
                  value={qParams.status || ""}
                  onValueChange={(value) => updateQuery({ status: value })}
                  options={Object.values(Status)}
                  isStatus
                  onClear={() => updateQuery({ status: undefined })}
                />
              </div>
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.category || ""}
                  onValueChange={(value) => updateQuery({ category: value })}
                  options={Object.values(Category)}
                  onClear={() => updateQuery({ category: undefined })}
                />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:hidden">
              <CardGridSkeleton count={4} />
            </div>
            <div className="phidden md:block">
              <TableSkeleton count={5} />
            </div>
          </>
        ) : activityDefinitions.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
              {activityDefinitions.map(
                (definition: ActivityDefinitionReadSpec) => (
                  <ActivityDefinitionCard
                    key={definition.id}
                    definition={definition}
                    facilityId={facilityId}
                  />
                ),
              )}
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead>{t("title")}</TableHead>
                      <TableHead>{t("category")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("kind")}</TableHead>
                      <TableHead className="text-right">
                        {t("actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {activityDefinitions.map(
                      (definition: ActivityDefinitionReadSpec) => (
                        <TableRow key={definition.id} className="divide-x">
                          <TableCell className="font-medium">
                            {definition.title}
                          </TableCell>
                          <TableCell>{t(definition.category)}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                ACTIVITY_DEFINITION_STATUS_COLORS[
                                  definition.status
                                ] || "bg-gray-100 text-gray-700"
                              }
                            >
                              {t(definition.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{t(definition.kind)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  navigate(
                                    `/facility/${facilityId}/settings/activity_definitions/${definition.id}`,
                                  )
                                }
                              >
                                <CareIcon icon="l-eye" className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  navigate(
                                    `/facility/${facilityId}/settings/activity_definitions/${definition.id}/edit`,
                                  )
                                }
                              >
                                <CareIcon icon="l-pen" className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        {response && response.count > resultsPerPage && (
          <div className="mt-4 flex justify-center">
            <Pagination totalCount={response.count} />
          </div>
        )}
      </div>
    </Page>
  );
}
