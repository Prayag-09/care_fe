import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { MedicationDispenseSummary } from "@/types/emr/medicationDispense/medicationDispense";
import medicationDispenseApi from "@/types/emr/medicationDispense/medicationDispenseApi";

export default function MedicationDispenseHistory({
  facilityId,
  locationId,
}: {
  facilityId: string;
  locationId: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery } = useFilters({
    limit: 14,
    disableCache: true,
  });

  const { data: prescriptionQueue, isLoading } = useQuery<
    PaginatedResponse<MedicationDispenseSummary>
  >({
    queryKey: ["medicationDispenseSummary", qParams],
    queryFn: query.debounced(medicationDispenseApi.summary, {
      pathParams: { facilityId },
      queryParams: {
        search: qParams.search,
        priority: qParams.priority,
        encounter_class: qParams.category,
        limit: qParams.limit,
        offset: ((qParams.page ?? 1) - 1) * (qParams.limit ?? 14),
        exclude_dispense_status: "complete",
      },
    }),
  });

  return (
    <Page title={t("medication_dispense")} className="p-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <Input
            placeholder={t("Search by patient name, ID, or prescription...")}
            value={qParams.search}
            onChange={(e) => updateQuery({ search: e.target.value })}
            className="w-full"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("patient")}</TableHead>
              <TableHead>{t("category")}</TableHead>
              <TableHead>{t("encounter_status")}</TableHead>
              <TableHead className="text-right">{t("medications")}</TableHead>
              <TableHead className="w-[100px]">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {t("Loading...")}
                </TableCell>
              </TableRow>
            ) : prescriptionQueue?.results?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {t("No prescriptions found")}
                </TableCell>
              </TableRow>
            ) : (
              prescriptionQueue?.results?.map(
                (item: MedicationDispenseSummary) => (
                  <TableRow key={item.encounter.id}>
                    <TableCell>
                      <div className="font-medium">
                        {item.encounter.patient.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.encounter.patient.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                        )}
                      >
                        {t(
                          `encounter_class__${item.encounter.encounter_class}`,
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                        )}
                      >
                        {t(`encounter_status__${item.encounter.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigate(
                            `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${item.encounter.patient.id}/to_be_dispensed`,
                          );
                        }}
                      >
                        {t("View")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ),
              )
            )}
          </TableBody>
        </Table>
      </div>
    </Page>
  );
}
