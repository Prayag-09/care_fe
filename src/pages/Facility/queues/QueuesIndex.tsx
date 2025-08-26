import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Page from "@/components/Common/Page";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import useAuthUser from "@/hooks/useAuthUser";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import scheduleApi from "@/types/scheduling/scheduleApi";
import { TokenQueueRead } from "@/types/tokens/tokenQueue/tokenQueue";
import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";
import { UserReadMinimal } from "@/types/user/user";

interface QueueCardProps {
  queue: TokenQueueRead;
  facilityId: string;
}

function QueueCard({ queue, facilityId }: QueueCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {queue.name}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {new Date(queue.date).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {queue.set_is_primary && (
              <Badge
                variant="primary"
                className="bg-primary text-primary-foreground"
              >
                {t("primary")}
              </Badge>
            )}
            {queue.system_generated && (
              <Badge variant="secondary">{t("system_generated")}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/facility/${facilityId}/queues/${queue.id}`}>
              {t("view_details")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QueuesIndex({
  facilityId,
  resourceType,
  resourceId,
}: {
  facilityId: string;
  resourceType: SchedulableResourceType;
  resourceId?: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    disableCache: true,
  });

  const { id: currentUserId } = useAuthUser();

  // Set default resourceId for practitioners
  const effectiveResourceId =
    qParams.resource_id ||
    resourceId ||
    (resourceType === SchedulableResourceType.Practitioner
      ? currentUserId.toString()
      : undefined);

  // Fetch available users for practitioner resource type
  const { data: availableUsersData } = useQuery({
    queryKey: ["availableUsers", facilityId],
    queryFn: query(scheduleApi.appointments.availableUsers, {
      pathParams: { facilityId },
    }),
    enabled: resourceType === SchedulableResourceType.Practitioner,
  });

  const availableUsers = availableUsersData?.users || [];

  // Handle date filter
  const handleDateChange = (date: Date | undefined) => {
    updateQuery({
      valid_from: date ? date.toISOString().split("T")[0] : undefined,
    });
  };

  // Handle resource selection
  const handleResourceChange = (selectedResourceId: string) => {
    updateQuery({ resource_id: selectedResourceId });
  };

  const { data: response, isLoading } = useQuery({
    queryKey: ["tokenQueues", facilityId, effectiveResourceId, qParams],
    queryFn: query(tokenQueueApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        resource_type: resourceType,
        resource_id: effectiveResourceId,
        valid_from: qParams.valid_from,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        ordering: "-created_date",
      },
    }),
  });

  const queues = response?.results || [];

  return (
    <Page title={t("token_queues")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t("token_queues")}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                {t("manage_token_queues_for_facility")}
              </p>
            </div>
            <Button asChild>
              <Link href={`/facility/${facilityId}/queues/create`}>
                <Plus className="size-4 mr-2" />
                {t("create_queue")}
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-6 flex flex-wrap gap-4 items-end">
          {/* Date Filter */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              {t("valid_from")}
            </label>
            <DatePicker
              date={
                qParams.valid_from ? new Date(qParams.valid_from) : undefined
              }
              onChange={handleDateChange}
            />
          </div>

          {/* Resource Picker - Only show for Practitioner resource type */}
          {resourceType === SchedulableResourceType.Practitioner && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                {t("practitioner")}
              </label>
              <Select
                value={qParams.resource_id || effectiveResourceId}
                onValueChange={handleResourceChange}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder={t("select_practitioner")} />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user: UserReadMinimal) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <CardListSkeleton count={4} />
          </div>
        ) : queues.length === 0 ? (
          <EmptyState
            icon="l-folder-open"
            title={t("no_queues_found")}
            description={t("no_queues_found_description")}
            action={
              <Button asChild>
                <Link href={`/facility/${facilityId}/queues/create`}>
                  <Plus className="size-4 mr-2" />
                  {t("create_first_queue")}
                </Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {queues.map((queue) => (
                <QueueCard
                  key={queue.id}
                  queue={queue}
                  facilityId={facilityId}
                />
              ))}
            </div>

            {response && response.count > resultsPerPage && (
              <div className="mt-6 flex justify-center">
                <Pagination totalCount={response.count} />
              </div>
            )}
          </>
        )}
      </div>
    </Page>
  );
}
