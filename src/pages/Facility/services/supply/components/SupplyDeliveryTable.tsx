import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import { SupplyDeliveryTab } from "@/pages/Facility/services/supply/SupplyDeliveryList";
import {
  SUPPLY_DELIVERY_CONDITION_COLORS,
  SUPPLY_DELIVERY_STATUS_COLORS,
  SupplyDeliveryRead,
} from "@/types/inventory/supplyDelivery/supplyDelivery";

interface Props {
  deliveries: SupplyDeliveryRead[];
  isLoading: boolean;
  facilityId: string;
  locationId: string;
  tab?: SupplyDeliveryTab;
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
    <div className="rounded-md overflow-hidden border-2 border-white shadow-md">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow className="divide-x">
            <TableHead className="text-gray-700">{t("item")}</TableHead>
            <TableHead className="text-gray-700">{t("quantity")}</TableHead>
            <TableHead className="text-gray-700">{t("condition")}</TableHead>
            {tab != null && (
              <TableHead className="text-gray-700">
                {tab === SupplyDeliveryTab.INCOMING
                  ? t("origin")
                  : t("destination")}
              </TableHead>
            )}
            <TableHead className="text-gray-700">{t("status")}</TableHead>
            <TableHead className="w-[100px] text-gray-700">
              {t("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {deliveries.map((delivery: SupplyDeliveryRead) => (
            <TableRow key={delivery.id} className="divide-x">
              <TableCell className="font-semibold text-gray-950">
                {delivery.supplied_item?.product_knowledge.name ||
                  delivery.supplied_inventory_item?.product.product_knowledge
                    .name}
                {delivery.supplied_item?.batch && (
                  <div className="text-xs text-gray-500 font-semibold ">
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
              <TableCell className="font-medium text-gray-950">
                {delivery.supplied_item_quantity}
              </TableCell>
              <TableCell>
                {delivery.supplied_item_condition && (
                  <Badge
                    variant={
                      SUPPLY_DELIVERY_CONDITION_COLORS[
                        delivery.supplied_item_condition
                      ]
                    }
                    className="capitalize"
                  >
                    {t(delivery.supplied_item_condition)}
                  </Badge>
                )}
              </TableCell>
              {tab != null && (
                <TableCell className="font-medium text-gray-950">
                  {tab === SupplyDeliveryTab.INCOMING
                    ? delivery.origin?.name
                    : delivery.destination.name}
                </TableCell>
              )}
              <TableCell>
                <Badge
                  variant={SUPPLY_DELIVERY_STATUS_COLORS[delivery.status]}
                  className="capitalize"
                >
                  {t(delivery.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-semibold text-gray-950"
                    onClick={() =>
                      navigate(
                        `/facility/${facilityId}/locations/${locationId}/supply_deliveries/${delivery.id}`,
                      )
                    }
                  >
                    <CareIcon icon="l-eye" className="size-4" />
                    {t("view_details")}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
