import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import ColoredIndicator from "@/CAREUI/display/ColoredIndicator";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import healthcareServiceApi from "@/types/healthcareService/healthcareServiceApi";

function LocationCard({
  location,
  facilityId,
  serviceId,
}: {
  location: { id: string; name: string; description?: string };
  facilityId: string;
  serviceId: string;
}) {
  const { t } = useTranslation();

  return (
    <Card className="transition-all duration-200 hover:border-primary/50 hover:shadow-sm rounded-md">
      <CardContent className="flex items-start gap-3 py-3 px-4">
        <div className="shrink-0 relative size-10 rounded-sm flex p-4 items-center justify-center">
          <ColoredIndicator
            id={location.id}
            className="absolute inset-0 rounded-sm opacity-20"
          />
          <CareIcon icon="l-flask" className="size-6 relative z-1" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold truncate text-gray-900 text-base">
              {location.name}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
              {location.description}
            </p>
          </div>
          <Button
            onClick={() =>
              navigate(
                `/facility/${facilityId}/services/${serviceId}/requests/locations/${location.id}`,
              )
            }
            variant="outline"
            size="sm"
            className="shrink-0 w-full sm:w-auto px-3 text-xs"
          >
            {t("view_requests")}
            <CareIcon icon="l-arrow-right" className="size-3 ml-1" />
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

  return (
    <div className="container px-4 mx-auto max-w-4xl space-y-6">
      <Button
        variant="outline"
        onClick={() => navigate(`/facility/${facilityId}/services`)}
        className="gap-2"
        size="sm"
      >
        <CareIcon icon="l-arrow-left" className="size-4" />
        {t("back_to_services")}
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isLoading
            ? t("service_details")
            : service?.name || t("service_details")}
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          {t("accurate_diagnostic_tests")}
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("available_locations")}
        </h2>

        <div className="space-y-2">
          {isLoading ? (
            <CardGridSkeleton count={3} />
          ) : !service ? (
            <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <CareIcon
                  icon="l-folder-open"
                  className="size-6 text-primary"
                />
              </div>
              <p className="text-lg font-semibold mb-1">
                {t("service_not_found")}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate(`/facility/${facilityId}/services`)}
              >
                {t("back_to_services")}
              </Button>
            </Card>
          ) : service.locations.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed">
              <div className="rounded-full bg-primary/10 p-3 mb-4">
                <CareIcon icon="l-map-marker" className="size-6 text-primary" />
              </div>
              <p className="text-lg font-semibold mb-1">
                {t("no_locations_available")}
              </p>
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
      </div>
    </div>
  );
}
