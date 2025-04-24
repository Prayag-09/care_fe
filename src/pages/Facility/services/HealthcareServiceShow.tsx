import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import healthcareServiceApi from "@/types/healthcareService/healthcareServiceApi";

function LocationCard({
  location,
  facilityId,
  serviceId,
}: {
  location: { id: string; name: string };
  facilityId: string;
  serviceId: string;
}) {
  const { t } = useTranslation();

  return (
    <Card className="group transition-all duration-200 hover:border-primary/50 hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-medium text-gray-900">{location.name}</h3>

          <Button
            onClick={() =>
              navigate(
                `/facility/${facilityId}/services/${serviceId}/requests/locations/${location.id}`,
              )
            }
            variant="outline"
            className="group-hover:border-primary group-hover:bg-primary group-hover:text-white"
          >
            {t("view_requests")}
            <CareIcon icon="l-arrow-right" className="ml-2 size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HealthcareServiceShow({
  facilityId,
  serviceId,
}: {
  facilityId: string;
  serviceId: string;
}) {
  const { t } = useTranslation();

  const { data: service, isLoading } = useQuery({
    queryKey: ["healthcareService", serviceId],
    queryFn: query(healthcareServiceApi.retrieveHealthcareService, {
      pathParams: {
        facilityId,
        healthcareServiceId: serviceId,
      },
    }),
  });

  if (isLoading) {
    return (
      <Page title={t("service_details")}>
        <div className="container mx-auto max-w-4xl py-8">
          <TableSkeleton count={3} />
        </div>
      </Page>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto max-w-4xl py-8">
        <Page title={t("service_not_found")}>
          <Card>
            <CardContent className="flex h-[200px] items-center justify-center">
              <div className="text-center">
                <CareIcon
                  icon="l-folder-open"
                  className="mx-auto mb-2 size-8"
                />
                <p className="text-gray-600">{t("service_not_found")}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate(`/facility/${facilityId}/services`)}
                >
                  {t("back_to_services")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </Page>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <Page title={service.name}>
        <div className="mb-6 flex items-center justify-between mt-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/facility/${facilityId}/services`)}
          >
            <CareIcon icon="l-arrow-left" className="mr-2 size-4" />
            {t("back_to_services")}
          </Button>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("available_locations")}
          </h2>
        </div>

        <div className="grid gap-4">
          {service.locations.length === 0 ? (
            <Card>
              <CardContent className="flex h-[200px] items-center justify-center">
                <div className="text-center">
                  <CareIcon
                    icon="l-map-marker"
                    className="mx-auto mb-2 size-8 text-gray-400"
                  />
                  <p className="text-gray-600">{t("no_locations_available")}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            service.locations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                facilityId={facilityId}
                serviceId={serviceId}
              />
            ))
          )}
        </div>
      </Page>
    </div>
  );
}
