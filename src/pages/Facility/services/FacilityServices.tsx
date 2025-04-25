import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import duoToneIcons from "@/CAREUI/icons/DuoTonePaths.json";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
        <p>{t("no_services_found")}</p>
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
    <Card className="group transition-all duration-200 hover:border-primary/50 hover:shadow-md">
      <CardContent className="p-6">
        <div className="mb-4 flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-2 h-full">
            <CareIcon
              icon={
                service.styling_metadata?.careIcon
                  ? getIconName(service.styling_metadata.careIcon)
                  : "d-health-worker"
              }
              className="text-7xl text-primary"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{service.name}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">
              {service.extra_details}
            </p>
          </div>
        </div>
        <div className="mt-4  pt-4">
          <Button
            onClick={() =>
              navigate(`/facility/${facilityId}/services/${service.id}`)
            }
            variant="outline"
            className="group-hover:border-primary group-hover:bg-primary group-hover:text-white"
          >
            {t("view_service_details")}
            <CareIcon icon="l-arrow-right" className="ml-2 size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function FacilityServicesPage({
  facilityId,
}: {
  facilityId: string;
}) {
  const { t } = useTranslation();
  const { qParams, Pagination, resultsPerPage } = useFilters({
    limit: 12,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["healthcareServices", qParams],
    queryFn: query(healthcareServiceApi.listHealthcareService, {
      pathParams: { facilityId },
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
      },
    }),
  });

  const healthcareServices = response?.results || [];

  return (
    <Page title={t("services")} hideTitleOnPage>
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">{t("services")}</h1>
          <p className="mt-2 text-lg text-gray-600">
            {t("discover_healthcare_services")}
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <CardGridSkeleton count={6} />
          </div>
        ) : healthcareServices.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          <div className="mt-8 flex justify-center">
            <Pagination totalCount={response.count} />
          </div>
        )}
      </div>
    </Page>
  );
}
