import * as React from "react";

function MonetaryValue({
  value,
  ...props
}: React.ComponentProps<"span"> & { value: number; currency?: string }) {
  const formattedValue = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value);

  return (
    <span data-slot="monetary-value" {...props}>
      {formattedValue}
    </span>
  );
}

export { MonetaryValue };
