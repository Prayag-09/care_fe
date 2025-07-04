import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";

import PurchaseOrderDetails from "./PurchaseOrderDetails";

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
  purchaseOrderId: string;
}

export default function PurchaseRequestView({
  facilityId,
  locationId,
  purchaseOrderId,
}: Props) {
  const { t } = useTranslation();

  const {
    data: request,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["purchaseOrder", purchaseOrderId],
    queryFn: query(supplyRequestApi.retrieveSupplyRequest, {
      pathParams: { supplyRequestId: purchaseOrderId },
    }),
  });

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
            <AlertTitle>{t("error_loading_purchase_order")}</AlertTitle>
            <AlertDescription>{t("purchase_order_not_found")}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() =>
              navigate(
                `/facility/${facilityId}/locations/${locationId}/external_supply/purchase_orders`,
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
    <Page title={t("purchase_order_details")} hideTitleOnPage>
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {t("purchase_order_details")}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {t("purchase_order_id")}: {request.id}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/locations/${locationId}/external_supply/purchase_orders`,
                  )
                }
              >
                {t("back_to_list")}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/locations/${locationId}/external_supply/purchase_orders/${purchaseOrderId}/edit`,
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
          <PurchaseOrderDetails
            request={request}
            facilityId={facilityId}
            locationId={locationId}
          />
        </div>
      </div>
    </Page>
  );
}
