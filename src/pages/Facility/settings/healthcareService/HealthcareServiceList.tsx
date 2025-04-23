import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import duoToneIcons from "@/CAREUI/icons/DuoTonePaths.json";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import Page from "@/components/Common/Page";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { type HealthcareServiceReadSpec } from "@/types/healthcareService/healthcareService";
import healthcareServiceApi from "@/types/healthcareService/healthcareServiceApi";

type DuoToneIconName = keyof typeof duoToneIcons;

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex h-[200px] items-center justify-center text-gray-500">
      <div className="text-center">
        <CareIcon icon="l-folder-open" className="mx-auto mb-2 size-8" />
        <p>{t("no_healthcare_services_found")}</p>
        <p className="text-sm">{t("adjust_healthcare_service_filters")}</p>
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  facilityId,
}: {
  service: HealthcareServiceReadSpec;
  facilityId: string;
}) {
  const { t } = useTranslation();
  const getIconName = (name: string): DuoToneIconName =>
    `d-${name}` as DuoToneIconName;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 rounded-lg bg-primary/10 p-2">
              <CareIcon
                icon={
                  service.styling_metadata?.careIcon
                    ? getIconName(service.styling_metadata.careIcon)
                    : "d-health-worker"
                }
                className="size-5 text-primary"
              />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{service.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                {service.extra_details || t("no_extra_details")}
              </p>
            </div>
          </div>
          <div className="flex flex-shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/healthcare_services/${service.id}`,
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
                  `/facility/${facilityId}/settings/healthcare_services/${service.id}/edit`,
                )
              }
            >
              <CareIcon icon="l-pen" className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HealthcareServiceList({
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
    queryKey: ["healthcareServices", qParams],
    queryFn: query(healthcareServiceApi.listHealthcareService, {
      pathParams: { facilityId },
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        search: qParams.search,
      },
    }),
  });

  const healthcareServices = response?.results || [];

  return (
    <Page title={t("healthcare_services")}>
      <div className="container mx-auto">
        <div className="mb-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="mt-1 text-sm text-gray-600">
                {t("manage_healthcare_services")}
              </p>
            </div>
            <Button
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/healthcare_services/new`,
                )
              }
            >
              <CareIcon icon="l-plus" className="mr-2" />
              {t("add_healthcare_service")}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Input
              placeholder={t("search_healthcare_services")}
              value={qParams.search || ""}
              onChange={(e) =>
                updateQuery({ search: e.target.value || undefined })
              }
              className="max-w-xs"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <CardGridSkeleton count={4} />
          </div>
        ) : healthcareServices.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {healthcareServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                facilityId={facilityId}
              />
            ))}
          </div>
        )}

        {response && response.count > resultsPerPage && (
          <div className="mt-6 flex justify-center">
            <Pagination totalCount={response.count} />
          </div>
        )}
      </div>
    </Page>
  );
}
