import { InfoIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import ChargeItemPriceDisplay from "@/components/Billing/ChargeItem/ChargeItemPriceDisplay";

import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";

interface ChargeItemCardProps {
  chargeItem: ChargeItemRead;
}

export function ChargeItemCard({ chargeItem }: ChargeItemCardProps) {
  const isPaid = !!chargeItem.paid_invoice;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-gray-600">{chargeItem.title}</div>
          <div className="font-semibold flex items-center gap-1">
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
          <div
            className={`text-sm px-2 py-1 rounded-md ${isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {isPaid ? "Paid" : "Unpaid"}
          </div>
        </div>
      </div>
    </Card>
  );
}
