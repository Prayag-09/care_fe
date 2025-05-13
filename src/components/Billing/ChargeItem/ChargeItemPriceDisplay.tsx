import { useTranslation } from "react-i18next";

import { MonetaryDisplay } from "@/components/ui/monetary-display";

import {
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";

interface ChargeItemPriceSummaryProps {
  priceComponents: MonetaryComponent[];
}

export default function ChargeItemPriceDisplay({
  priceComponents,
}: ChargeItemPriceSummaryProps) {
  const { t } = useTranslation();

  if (!priceComponents?.length) return null;

  const baseComponents = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.base,
  );
  const taxComponents = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.tax,
  );
  const discountComponents = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.discount,
  );
  const surchargeComponents = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.surcharge,
  );

  const baseAmount = baseComponents[0]?.amount || 0;

  const discountTotal = discountComponents.reduce((total, component) => {
    return total + (baseAmount * (component.factor || 0)) / 100;
  }, 0);

  const surchargeTotal = surchargeComponents.reduce((total, component) => {
    return total + (baseAmount * (component.factor || 0)) / 100;
  }, 0);

  const netAmount = baseAmount + surchargeTotal - discountTotal;

  const taxTotal = taxComponents.reduce((total, component) => {
    return total + (netAmount * (component.factor || 0)) / 100;
  }, 0);

  const totalAmount = netAmount + taxTotal;

  return (
    <div className="p-3">
      <p className="font-medium text-sm mb-2">{t("single_item_breakdown")}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span>{t("base_amount")}</span>
          <MonetaryDisplay amount={baseAmount} />
        </div>

        {surchargeComponents.map((component, index) => (
          <div
            key={`surcharge-${index}`}
            className="flex justify-between text-gray-500"
          >
            <span>{component.code?.display || t("surcharge")}</span>
            <span>
              +
              <MonetaryDisplay
                amount={(baseAmount * (component.factor || 0)) / 100}
              />
              {component.factor ? ` (${component.factor}%)` : ""}
            </span>
          </div>
        ))}

        {discountComponents.map((component, index) => (
          <div
            key={`discount-${index}`}
            className="flex justify-between text-gray-500"
          >
            <span>{component.code?.display || t("discount")}</span>
            <span>
              -
              <MonetaryDisplay
                amount={(baseAmount * (component.factor || 0)) / 100}
              />
              {component.factor ? ` (${component.factor}%)` : ""}
            </span>
          </div>
        ))}

        <div className="flex justify-between pt-1">
          <span className="text-gray-500">{t("net_amount")}</span>
          <MonetaryDisplay amount={netAmount} />
        </div>

        {taxComponents.map((component, index) => (
          <div
            key={`tax-${index}`}
            className="flex justify-between text-gray-500"
          >
            <span>{component.code?.display || t("tax")}</span>
            <span>
              +
              <MonetaryDisplay
                amount={(netAmount * (component.factor || 0)) / 100}
              />
              {component.factor ? ` (${component.factor}%)` : ""}
            </span>
          </div>
        ))}

        <div className="flex justify-between pt-1 font-medium">
          <span>{t("total")}</span>
          <MonetaryDisplay amount={totalAmount} />
        </div>
      </div>
    </div>
  );
}
