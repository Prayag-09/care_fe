import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DefinitionList,
  DefinitionListItem,
} from "@/components/ui/definition-list";

import { SupplyRequestRead } from "@/types/inventory/supplyRequest/supplyRequest";

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

interface Props {
  request: SupplyRequestRead;
  facilityId: string;
  locationId: string;
  showViewDetails?: boolean;
}

export default function SupplyRequestDetails({
  request,
  facilityId,
  locationId,
  showViewDetails = false,
}: Props) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("supply_request_details")}</CardTitle>
        {showViewDetails && (
          <Button
            variant="outline"
            onClick={() =>
              navigate(
                `/facility/${facilityId}/locations/${locationId}/supply_requests/${request.id}`,
              )
            }
          >
            {t("view_details")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <DefinitionList>
          <DefinitionListItem
            term={t("item")}
            description={request.item.name}
          />
          <DefinitionListItem
            term={t("quantity")}
            description={request.quantity}
          />
          <DefinitionListItem
            term={t("deliver_from")}
            description={request.deliver_from?.name || t("not_specified")}
          />
          <DefinitionListItem
            term={t("deliver_to")}
            description={request.deliver_to.name}
          />
          <DefinitionListItem
            term={t("category")}
            description={t(request.category)}
          />
          <DefinitionListItem
            term={t("intent")}
            description={t(request.intent)}
          />
          <DefinitionListItem
            term={t("reason")}
            description={t(request.reason)}
          />
          <DefinitionListItem
            term={t("status")}
            description={
              <Badge
                className={STATUS_COLORS[request.status]}
                variant="secondary"
              >
                {t(request.status)}
              </Badge>
            }
          />
          <DefinitionListItem
            term={t("priority")}
            description={
              <Badge
                className={PRIORITY_COLORS[request.priority]}
                variant="secondary"
              >
                {t(request.priority)}
              </Badge>
            }
          />
        </DefinitionList>
      </CardContent>
    </Card>
  );
}
