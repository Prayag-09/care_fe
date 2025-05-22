import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DefinitionList,
  DefinitionListItem,
} from "@/components/ui/definition-list";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";

export function SupplyDeliveryDetails({ deliveryId }: { deliveryId: string }) {
  const { t } = useTranslation();

  const { data: delivery } = useQuery({
    queryKey: ["supply-delivery", deliveryId],
    queryFn: query(supplyDeliveryApi.retrieveSupplyDelivery, {
      pathParams: { supplyDeliveryId: deliveryId },
    }),
  });

  if (!delivery) {
    return <CardListSkeleton count={2} />;
  }

  return (
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
                className={
                  {
                    in_progress: "bg-amber-100 text-amber-700",
                    completed: "bg-green-100 text-green-700",
                    abandoned: "bg-red-100 text-red-700",
                    entered_in_error: "bg-red-100 text-red-700",
                  }[delivery.status]
                }
                variant="secondary"
              >
                {t(delivery.status)}
              </Badge>
            }
          />
        </DefinitionList>
      </CardContent>
    </Card>
  );
}
