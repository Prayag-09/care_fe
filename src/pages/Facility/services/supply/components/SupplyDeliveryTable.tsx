import { useMutation, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { EmptyState } from "@/components/definition-list/EmptyState";

import mutate from "@/Utils/request/mutate";
import { SupplyDeliveryTab } from "@/pages/Facility/services/supply/SupplyDeliveryList";
import {
  SupplyDeliveryRead,
  SupplyDeliveryStatus,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";

const STATUS_COLORS: Record<string, string> = {
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  abandoned: "bg-red-100 text-red-700",
  entered_in_error: "bg-red-100 text-red-700",
};

interface Props {
  deliveries: SupplyDeliveryRead[];
  isLoading: boolean;
  facilityId: string;
  locationId: string;
  tab: SupplyDeliveryTab;
}

export default function SupplyDeliveryTable({
  deliveries,
  isLoading,
  facilityId,
  locationId,
  tab,
}: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  if (deliveries.length === 0) {
    return (
      <EmptyState
        title={t("no_supply_deliveries_found")}
        description={t("no_supply_deliveries_found_description")}
        icon="l-box"
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("item")}</TableHead>
            <TableHead>{t("quantity")}</TableHead>
            <TableHead>
              {tab === SupplyDeliveryTab.INCOMING
                ? t("origin")
                : t("destination")}
            </TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead className="w-[100px]">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deliveries.map((delivery: SupplyDeliveryRead) => (
            <TableRow key={delivery.id}>
              <TableCell>
                {delivery.supplied_item?.product_knowledge.name ||
                  delivery.supplied_inventory_item?.product.product_knowledge
                    .name}
                {delivery.supplied_item?.batch && (
                  <div className="text-xs text-gray-500 font-normal">
                    Lot #{delivery.supplied_item.batch.lot_number}
                  </div>
                )}
                {delivery.supplied_inventory_item?.product.batch && (
                  <div className="text-xs text-gray-500 font-normal">
                    Exp. #
                    {delivery.supplied_inventory_item?.product.batch.lot_number}
                  </div>
                )}
              </TableCell>
              <TableCell>{delivery.supplied_item_quantity}</TableCell>
              <TableCell>
                {tab === SupplyDeliveryTab.INCOMING
                  ? delivery.origin?.name
                  : delivery.destination.name}
              </TableCell>
              <TableCell>
                <Badge
                  className={STATUS_COLORS[delivery.status]}
                  variant="secondary"
                >
                  {t(delivery.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/locations/${locationId}/supply_deliveries/${delivery.id}`,
                      )
                    }
                  >
                    <CareIcon icon="l-eye" className="size-4" />
                  </Button>
                  {delivery.status === SupplyDeliveryStatus.in_progress && (
                    <SupplyDeliveryMarkAsCompleteButton delivery={delivery} />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

const SupplyDeliveryMarkAsCompleteButton = ({
  delivery,
}: {
  delivery: SupplyDeliveryRead;
}) => {
  const queryClient = useQueryClient();

  const { mutate: updateDeliveryStatus } = useMutation({
    mutationFn: mutate(supplyDeliveryApi.updateSupplyDelivery, {
      pathParams: { supplyDeliveryId: delivery.id },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supplyDeliveries"] });
    },
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() =>
        updateDeliveryStatus({
          status: SupplyDeliveryStatus.completed,
          supplied_item_quantity: delivery.supplied_item_quantity,
          supplied_item: delivery.supplied_item?.id,
          supplied_inventory_item: delivery.supplied_inventory_item?.id,
          supplied_item_type: delivery.supplied_item_type,
          origin: delivery.origin?.id,
          destination: delivery.destination.id,
          supply_request: delivery.supply_request?.id,
        })
      }
    >
      <CareIcon icon="l-check" className="size-4" />
    </Button>
  );
};
