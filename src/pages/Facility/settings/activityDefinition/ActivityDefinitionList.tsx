import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { type ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex h-[200px] items-center justify-center text-gray-500">
      <div className="text-center">
        <CareIcon icon="l-folder-open" className="mx-auto mb-2 size-8" />
        <p>{t("no_activity_definitions_found")}</p>
        <p className="text-sm">{t("adjust_activity_definition_filters")}</p>
      </div>
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
    queryFn: query(activityDefinitionApi.listActivityDefinition, {
      pathParams: { facilityId },
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        search: qParams.search,
        status: qParams.status || "active",
        category: qParams.category,
      },
    }),
  });

  const activityDefinitions = response?.results || [];

  return (
    <Page title={t("activity_definitions")}>
      <div className="container mx-auto">
        <div className="mb-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-gray-600">
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

          <div className="mb-4 flex flex-wrap items-center gap-4">
            <Input
              placeholder={t("search_activity_definitions")}
              value={qParams.search || ""}
              onChange={(e) =>
                updateQuery({ search: e.target.value || undefined })
              }
              className="max-w-xs"
            />
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton count={5} />
        ) : activityDefinitions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("title")}</TableHead>
                  <TableHead>{t("category")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("kind")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityDefinitions.map(
                  (definition: ActivityDefinitionReadSpec) => (
                    <TableRow key={definition.id}>
                      <TableCell className="font-medium">
                        {definition.title}
                      </TableCell>
                      <TableCell>{t(definition.category)}</TableCell>
                      <TableCell>{t(definition.status)}</TableCell>
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
