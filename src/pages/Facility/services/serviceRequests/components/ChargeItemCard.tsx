import { t } from "i18next";
import { InfoIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import ChargeItemPriceDisplay from "@/components/Billing/ChargeItem/ChargeItemPriceDisplay";

import {
  CHARGE_ITEM_STATUS_COLORS,
  ChargeItemRead,
} from "@/types/billing/chargeItem/chargeItem";

interface ChargeItemCardProps {
  chargeItem: ChargeItemRead;
}

export function ChargeItemCard({ chargeItem }: ChargeItemCardProps) {
  const isPaid = !!chargeItem.paid_invoice;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex flex-row items-center text-sm text-gray-600 gap-2">
            <span className="text-base text-gray-950">{chargeItem.title}</span>
            {chargeItem.quantity > 1 && (
              <span className="text-sm text-gray-950">
                {t("x")} {chargeItem.quantity}
              </span>
            )}
            <Badge variant={CHARGE_ITEM_STATUS_COLORS[chargeItem.status]}>
              {t(chargeItem.status)}
            </Badge>
          </div>
          <div className="font-semibold flex items-center">
            <span>₹{chargeItem.total_price}</span>
            {chargeItem.total_price_components?.length > 0 && (
              <Popover>
                <PopoverTrigger>
                  <InfoIcon className="size-4 text-gray-700 cursor-pointer" />
                </PopoverTrigger>
                <PopoverContent side="right" className="p-0">
                  <ChargeItemPriceDisplay
                    priceComponents={chargeItem.total_price_components}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="text-sm text-gray-600">Payment Status:</div>
          <Badge variant={isPaid ? "green" : "destructive"}>
            {isPaid ? t("paid") : t("unpaid")}
          </Badge>
        </div>
      </div>
    </Card>
  );
}
