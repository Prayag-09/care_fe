import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import {
  SupplyDeliveryCondition,
  SupplyDeliveryStatus,
  SupplyDeliveryType,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";

import SupplyDeliveryForm from "./SupplyDeliveryForm";
import { SupplyDeliveryTab } from "./SupplyDeliveryList";
import SupplyDeliveryTable from "./components/SupplyDeliveryTable";
import SupplyRequestDetails from "./components/SupplyRequestDetails";

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
  supplyRequestId: string;
}

export default function SupplyRequestView({
  facilityId,
  locationId,
  supplyRequestId,
}: Props) {
  const { t } = useTranslation();
  const [isDeliverySheetOpen, setIsDeliverySheetOpen] = useState(false);

  const {
    data: request,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["supplyRequest", supplyRequestId],
    queryFn: query(supplyRequestApi.retrieveSupplyRequest, {
      pathParams: { supplyRequestId },
    }),
  });

  const { data: deliveriesResponse, isLoading: isLoadingDeliveries } = useQuery(
    {
      queryKey: ["supplyDeliveries", supplyRequestId],
      queryFn: query(supplyDeliveryApi.listSupplyDelivery, {
        queryParams: {
          facility: facilityId,
          supply_request: supplyRequestId,
        },
      }),
    },
  );

  const deliveries = deliveriesResponse?.results || [];

  if (isLoading) {
    return (
      <Page title={t("loading")}>
        <LoadingSkeleton />
      </Page>
    );
  }

  if (isError || !request) {
    return (
      <Page title={t("error")}>
        <div className="container mx-auto max-w-3xl py-8">
          <Alert variant="destructive">
            <CareIcon icon="l-exclamation-triangle" className="size-4" />
            <AlertTitle>{t("error_loading_supply_request")}</AlertTitle>
            <AlertDescription>{t("supply_request_not_found")}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() =>
              navigate(
                `/facility/${facilityId}/locations/${locationId}/supply_requests`,
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
    <Page title={t("supply_request_details")} hideTitleOnPage>
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {t("supply_request_details")}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {t("supply_request_id")}: {request.id}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/locations/${locationId}/supply_requests`,
                  )
                }
              >
                {t("back_to_list")}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/locations/${locationId}/supply_requests/${supplyRequestId}/edit`,
                  )
                }
              >
                <CareIcon icon="l-pen" className="mr-2 size-4" />
                {t("edit")}
              </Button>
              {request.deliver_from?.id === locationId && (
                <Button onClick={() => setIsDeliverySheetOpen(true)}>
                  <CareIcon icon="l-truck" className="mr-2 size-4" />
                  {t("create_delivery")}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <SupplyRequestDetails
            request={request}
            facilityId={facilityId}
            locationId={locationId}
          />

          {deliveries.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("deliveries")}</CardTitle>
              </CardHeader>
              <CardContent>
                <SupplyDeliveryTable
                  deliveries={deliveries}
                  isLoading={isLoadingDeliveries}
                  facilityId={facilityId}
                  locationId={locationId}
                  tab={SupplyDeliveryTab.INCOMING}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <Sheet open={isDeliverySheetOpen} onOpenChange={setIsDeliverySheetOpen}>
          <SheetContent className="w-full sm:max-w-3xl">
            <SheetHeader>
              <SheetTitle>{t("create_delivery")}</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <SupplyDeliveryForm
                facilityId={facilityId}
                locationId={locationId}
                onSuccess={() => setIsDeliverySheetOpen(false)}
                productKnowledgeId={request.item.id}
                defaultValues={{
                  deliveries: [
                    {
                      status: SupplyDeliveryStatus.in_progress,
                      supplied_item_type: SupplyDeliveryType.product,
                      supplied_item_quantity: request.quantity,
                      supplied_inventory_item: request.item.id,
                      origin: request.deliver_from?.id,
                      destination: request.deliver_to.id,
                      supply_request: request.id,
                      supplied_item_condition: SupplyDeliveryCondition.normal,
                    },
                  ],
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </Page>
  );
}
