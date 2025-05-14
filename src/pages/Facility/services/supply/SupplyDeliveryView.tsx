import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DefinitionList } from "@/components/ui/definition-list";
import { DefinitionListItem } from "@/components/ui/definition-list";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";

const STATUS_COLORS: Record<string, string> = {
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  abandoned: "bg-red-100 text-red-700",
  entered_in_error: "bg-red-100 text-red-700",
};

function LoadingSkeleton() {
  return (
    <div className="container mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-md bg-gray-200" />
          <div className="h-4 w-32 animate-pulse rounded-md bg-gray-200" />
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="h-6 w-32 animate-pulse rounded-md bg-gray-200" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded-md bg-gray-200" />
              <div className="h-4 w-3/4 animate-pulse rounded-md bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  facilityId: string;
  locationId: string;
  supplyDeliveryId: string;
}

export default function SupplyDeliveryView({
  facilityId,
  locationId,
  supplyDeliveryId,
}: Props) {
  const { t } = useTranslation();

  const {
    data: delivery,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["supplyDelivery", supplyDeliveryId],
    queryFn: query(supplyDeliveryApi.retrieveSupplyDelivery, {
      pathParams: { supplyDeliveryId },
    }),
  });

  if (isLoading) {
    return (
      <Page title={t("loading")}>
        <LoadingSkeleton />
      </Page>
    );
  }

  if (isError || !delivery) {
    return (
      <Page title={t("error")}>
        <div className="container mx-auto max-w-3xl py-8">
          <Alert variant="destructive">
            <CareIcon icon="l-exclamation-triangle" className="size-4" />
            <AlertTitle>{t("error_loading_supply_delivery")}</AlertTitle>
            <AlertDescription>
              {t("supply_delivery_not_found")}
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() =>
              navigate(
                `/facility/${facilityId}/locations/${locationId}/supply_deliveries`,
              )
            }
          >
            <CareIcon icon="l-arrow-left" className="mr-2 size-4" />
            {t("back_to_list")}
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page title={t("supply_delivery_details")} hideTitleOnPage>
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {t("supply_delivery_details")}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {t("supply_delivery_id")}: {delivery.id}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/locations/${locationId}/supply_deliveries`,
                  )
                }
              >
                {t("back_to_list")}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/locations/${locationId}/supply_deliveries/${supplyDeliveryId}/edit`,
                  )
                }
              >
                <CareIcon icon="l-pen" className="mr-2 size-4" />
                {t("edit")}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("delivery_details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DefinitionList>
                <DefinitionListItem
                  term={t("supplied_item")}
                  description={delivery.supplied_item.product_knowledge.name}
                />
                <DefinitionListItem
                  term={t("supplied_item_quantity")}
                  description={delivery.supplied_item_quantity}
                />
                <DefinitionListItem
                  term={t("supplied_item_type")}
                  description={t(delivery.supplied_item_type)}
                />
                {delivery.supplied_item_condition && (
                  <DefinitionListItem
                    term={t("supplied_item_condition")}
                    description={t(delivery.supplied_item_condition)}
                  />
                )}
                <DefinitionListItem
                  term={t("origin")}
                  description={delivery.origin?.name}
                />
                <DefinitionListItem
                  term={t("destination")}
                  description={delivery.destination.name}
                />
                <DefinitionListItem
                  term={t("status")}
                  description={
                    <Badge
                      className={STATUS_COLORS[delivery.status]}
                      variant="secondary"
                    >
                      {t(delivery.status)}
                    </Badge>
                  }
                />
              </DefinitionList>
            </CardContent>
          </Card>
        </div>
      </div>
    </Page>
  );
}
