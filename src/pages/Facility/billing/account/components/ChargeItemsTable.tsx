import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

import UnitPriceDisplay from "./UnitPriceDisplay";

function formatCurrency(amount: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export interface ChargeItemsTableProps {
  isLoading: boolean;
  items?: ChargeItemRead[];
  onAddClick: () => void;
}

export function ChargeItemsTable({
  isLoading,
  items,
  onAddClick,
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
        <Button variant="outline" onClick={onAddClick}>
          <CareIcon icon="l-plus" className="mr-2 size-4" />
          {t("add_charge_item")}
        </Button>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {!items?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
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
                        "USD",
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t(item.status)}</Badge>
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
