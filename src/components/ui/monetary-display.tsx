import * as React from "react";

import { MonetaryComponent } from "@/types/base/monetaryComponent/monetaryComponent";

export const numberFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

function MonetaryDisplay({
  amount,
  factor,
  fallback,
  ...props
}: Pick<MonetaryComponent, "amount" | "factor"> & {
  fallback?: React.ReactNode;
} & React.ComponentProps<"data">) {
  if ((amount ?? factor) == null) {
    return fallback ?? "-";
  }

  return (
    <data
      data-slot="monetary-value"
      data-monetary-type={amount ? "amount" : "factor"}
      data-amount={amount}
      data-factor={factor}
      {...props}
    >
      {amount != null && numberFormatter.format(amount)}
      {factor != null && `${factor?.toFixed(2)}%`}
    </data>
  );
}

export { MonetaryDisplay };
