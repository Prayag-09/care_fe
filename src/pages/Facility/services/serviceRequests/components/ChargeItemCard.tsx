import { Card } from "@/components/ui/card";

import { ChargeItemBase } from "@/types/billing/chargeItem/chargeItem";

interface ChargeItemCardProps {
  chargeItem: ChargeItemBase;
}

export function ChargeItemCard({ chargeItem }: ChargeItemCardProps) {
  const isPaid = !!chargeItem.paid_invoice;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-gray-600">{chargeItem.title}</div>
          <div className="font-semibold">₹{chargeItem.total_price}</div>
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
