import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import {
  MonetoryComponent,
  MonetoryComponentType,
} from "@/types/base/monetoryComponent/monetoryComponent";

const monetoryComponentColorMap: Record<MonetoryComponentType, string> = {
  base: "primary",
  surcharge: "destructive",
  tax: "warning",
  discount: "success",
  informational: "secondary",
};

function formatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount);
}

export interface UnitPriceDisplayProps {
  components: MonetoryComponent[];
}

export function UnitPriceDisplay({ components }: UnitPriceDisplayProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-2">
      {components.map((price, index) => (
        <Badge
          key={`${index}-${price.monetory_component_type}`}
          variant={
            monetoryComponentColorMap[price.monetory_component_type] as any
          }
        >
          {price.factor
            ? `${(price.factor * 100).toFixed(0)}%`
            : formatCurrency(price.amount || 0, "INR")}{" "}
          {t(price.monetory_component_type)}
        </Badge>
      ))}
    </div>
  );
}

export default UnitPriceDisplay;
