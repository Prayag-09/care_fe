import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  draft: "bg-gray-100 text-gray-700",
  suspended: "bg-amber-100 text-amber-700",
  entered_in_error: "bg-red-100 text-red-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  routine: "bg-blue-100 text-blue-700",
  urgent: "bg-red-100 text-red-700",
  asap: "bg-amber-100 text-amber-700",
  stat: "bg-purple-100 text-purple-700",
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
  supplyRequestId: string;
}

export default function SupplyRequestView({
  facilityId,
  locationId,
  supplyRequestId,
}: Props) {
  const { t } = useTranslation();

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
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("request_details")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {t("status")}
                  </div>
                  <Badge
                    className={STATUS_COLORS[request.status]}
                    variant="secondary"
                  >
                    {t(request.status)}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {t("priority")}
                  </div>
                  <Badge
                    className={PRIORITY_COLORS[request.priority]}
                    variant="secondary"
                  >
                    {t(request.priority)}
                  </Badge>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {t("item")}
                  </div>
                  <div className="mt-1">{request.item.name}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {t("quantity")}
                  </div>
                  <div className="mt-1">{request.quantity}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {t("deliver_from")}
                  </div>
                  <div className="mt-1">
                    {request.deliver_from?.name || t("not_specified")}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {t("deliver_to")}
                  </div>
                  <div className="mt-1">{request.deliver_to.name}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {t("category")}
                  </div>
                  <div className="mt-1">{t(request.category)}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {t("intent")}
                  </div>
                  <div className="mt-1">{t(request.intent)}</div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    {t("reason")}
                  </div>
                  <div className="mt-1">{t(request.reason)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Page>
  );
}
