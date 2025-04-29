import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";

import EditChargeItemPopover from "./EditChargeItemPopover";
import UnitPriceDisplay from "./UnitPriceDisplay";

function formatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount);
}

export interface ChargeItemsTableProps {
  isLoading: boolean;
  items?: ChargeItemRead[];
  facilityId: string;
}

export function ChargeItemsTable({
  isLoading,
  items,
  facilityId,
}: ChargeItemsTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("charge_items")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("billable_items_for_account")}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton count={3} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("item")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead>{t("unit_price")}</TableHead>
                <TableHead>{t("total")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!items?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    {t("no_charge_items")}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <UnitPriceDisplay
                        components={item.unit_price_component}
                      />
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        item.total_price ||
                          item.quantity *
                            (item.unit_price_component.find(
                              (p) => p.monetory_component_type === "base",
                            )?.amount || 0),
                        "INR",
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t(item.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      <EditChargeItemPopover
                        facilityId={facilityId}
                        item={item}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default ChargeItemsTable;
