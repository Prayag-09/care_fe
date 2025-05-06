import * as React from "react";

import { MonetoryComponent } from "@/types/base/monetoryComponent/monetoryComponent";

const numberFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

function MonetoryDisplay({
  amount,
  factor,
  ...props
}: Pick<MonetoryComponent, "amount" | "factor"> &
  React.ComponentProps<"data">) {
  if (!(amount || factor)) {
    return null;
  }

  return (
    <data
      data-slot="monetory-value"
      data-monetory-type={amount ? "amount" : "factor"}
      data-amount={amount}
      data-factor={factor}
      {...props}
    >
      {amount ? numberFormatter.format(amount) : factor?.toFixed(0)}
    </data>
  );
}

/**
 * @deprecated Use `MonetoryDisplay` instead
 */
function MonetaryValue({
  value,
  ...props
}: React.ComponentProps<"data"> & { value: number }) {
  return <MonetoryDisplay amount={value} {...props} />;
}

export { MonetaryValue, MonetoryDisplay };
