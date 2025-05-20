import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { MedicationDispenseHistoryTable } from "@/components/Medicine/MedicationDispense/MedicationDispenseHistoryTable";
import { EmptyState } from "@/components/definition-list/EmptyState";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { MedicationDispenseStatus } from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";

function FilterSelect({
  value,
  onValueChange,
  options,
  onClear,
}: {
  value: string;
  onValueChange: (value: string | undefined) => void;
  options: string[];
  onClear: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex overflow-hidden rounded-lg border">
      <Select
        value={value}
        onValueChange={(newValue) => onValueChange(newValue || undefined)}
      >
        <SelectTrigger className="border-0 hover:bg-transparent focus:ring-0 focus:ring-offset-0">
          <div className="flex items-center gap-2">
            <CareIcon icon="l-filter" className="size-4" />
            {!value ? null : (
              <>
                <span>{t("status")}</span>
                <span className="text-gray-500">{t("is")}</span>
                <span>{t(value)}</span>
              </>
            )}
            {!value && <span className="text-gray-500">{t("status")}</span>}
          </div>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {t(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="h-auto border-l px-2 hover:bg-transparent"
        >
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}

interface Props {
  locationId: string;
}

export default function MedicationDispenseHistory({ locationId }: Props) {
  const { t } = useTranslation();
  const { qParams, updateQuery } = useFilters({
    disableCache: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["medication_dispenses", locationId, qParams.status],
    queryFn: query(medicationDispenseApi.list, {
      queryParams: {
        location: locationId,
        status: qParams.status,
      },
    }),
  });

  const handleClearStatus = () => {
    updateQuery({ status: undefined });
  };

  return (
    <Page
      title={t("medication_dispense_history")}
      options={
        <FilterSelect
          value={qParams.status || ""}
          onValueChange={(value) => updateQuery({ status: value })}
          options={Object.values(MedicationDispenseStatus)}
          onClear={handleClearStatus}
        />
      }
    >
      <Separator className="my-4" />
      {isLoading ? (
        <TableSkeleton count={5} />
      ) : !data?.results?.length ? (
        <EmptyState
          icon="l-tablets"
          title={t("no_dispenses_found")}
          description={t("no_dispenses_found_description")}
        />
      ) : (
        <MedicationDispenseHistoryTable data={data.results} />
      )}
    </Page>
  );
}
