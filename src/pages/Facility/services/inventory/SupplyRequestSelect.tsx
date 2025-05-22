import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";

import query from "@/Utils/request/query";
import { mergeAutocompleteOptions } from "@/Utils/utils";
import { SupplyRequestRead } from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";

interface SupplyRequestSelectProps {
  value?: SupplyRequestRead;
  onChange: (value: SupplyRequestRead) => void;
  locationId: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  inputPlaceholder?: string;
  noOptionsMessage?: string;
}

export function SupplyRequestSelect({
  value,
  onChange,
  locationId,
  disabled,
  className,
  placeholder,
  inputPlaceholder,
  noOptionsMessage,
}: SupplyRequestSelectProps) {
  const { t } = useTranslation();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["supplyRequests", locationId],
    queryFn: query(supplyRequestApi.listSupplyRequest, {
      queryParams: {
        deliver_to: locationId,
        deliver_from_isnull: true,
      },
    }),
  });

  const options = mergeAutocompleteOptions(
    requests?.results.map((request) => ({
      label: `${request.item.name} (Qty: ${request.quantity}) - #${request.id.slice(0, 6)}`,
      value: request.id,
    })) || [],
    value
      ? {
          label: `${value.item.name} (Qty: ${value.quantity}) - #${value.id.slice(0, 6)}`,
          value: value.id,
        }
      : undefined,
  );

  return (
    <Autocomplete
      value={value?.id || ""}
      onChange={(selectedId) => {
        const selectedRequest = requests?.results.find(
          (r) => r.id === selectedId,
        );
        if (selectedRequest) {
          onChange(selectedRequest);
        }
      }}
      options={options}
      isLoading={isLoading}
      placeholder={placeholder || t("select_supply_request")}
      inputPlaceholder={inputPlaceholder || t("search_supply_requests")}
      noOptionsMessage={noOptionsMessage || t("no_supply_requests_found")}
      disabled={disabled}
      className={className}
      closeOnSelect
    />
  );
}
