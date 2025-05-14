import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

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
import { ENCOUNTER_CLASS } from "@/types/emr/encounter";
import {
  MedicationPriority,
  MedicationRequestSummary,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";

const PRIORITY_BADGES = {
  [MedicationPriority.STAT]: {
    label: "stat",
    className: "bg-red-100 text-red-800",
  },
  [MedicationPriority.URGENT]: {
    label: "urgent",
    className: "bg-orange-100 text-orange-800",
  },
  [MedicationPriority.ASAP]: {
    label: "asap",
    className: "bg-yellow-100 text-yellow-800",
  },
  [MedicationPriority.ROUTINE]: {
    label: "routine",
    className: "bg-blue-100 text-blue-800",
  },
} as const;

export default function MedicationRequestList({
  facilityId,
  serviceId,
  locationId,
}: {
  facilityId: string;
  serviceId: string;
  locationId: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery } = useFilters({
    limit: 14,
    disableCache: true,
  });

  const { data: prescriptionQueue, isLoading } = useQuery<
    PaginatedResponse<MedicationRequestSummary>
  >({
    queryKey: ["prescriptionQueue", qParams],
    queryFn: query.debounced(medicationRequestApi.summary, {
      pathParams: { facilityId },
      queryParams: {
        search: qParams.search,
        priority: qParams.priority,
        encounter_class: qParams.category,
        limit: qParams.limit,
        offset: ((qParams.page ?? 1) - 1) * (qParams.limit ?? 14),
      },
    }),
  });

  return (
    <Page title={t("Prescription Queue")} className="p-4">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <Input
            placeholder={t("Search by patient name, ID, or prescription...")}
            value={qParams.search}
            onChange={(e) => updateQuery({ search: e.target.value })}
            className="w-full"
          />
        </div>
        <Button
          variant="outline"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/services/${serviceId}/medication_requests/locations/${locationId}/supply_requests`,
            )
          }
        >
          {t("Supply Requests")}
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant={!qParams.priority ? "default" : "outline"}
            onClick={() => updateQuery({ priority: undefined })}
          >
            {t("All Priorities")}
          </Button>
          {Object.entries(PRIORITY_BADGES).map(([key, { label }]) => (
            <Button
              key={key}
              variant={qParams.priority === key ? "default" : "outline"}
              onClick={() => updateQuery({ priority: key })}
            >
              {t(label)}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Button
          variant={!qParams.category ? "default" : "outline"}
          onClick={() => updateQuery({ category: undefined })}
        >
          {t("All Categories")}
        </Button>
        {Object.entries(ENCOUNTER_CLASS).map(([key, label]) => (
          <Button
            key={key}
            variant={qParams.category === key ? "default" : "outline"}
            onClick={() => updateQuery({ category: key })}
          >
            {t(label)}
          </Button>
        ))}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("Patient")}</TableHead>
              <TableHead>{t("Priority")}</TableHead>
              <TableHead>{t("Category")}</TableHead>
              <TableHead className="text-right">{t("Medications")}</TableHead>
              <TableHead className="w-[100px]">{t("Actions")}</TableHead>
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
                (item: MedicationRequestSummary) => (
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
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          PRIORITY_BADGES[item.priority].className,
                        )}
                      >
                        {t(PRIORITY_BADGES[item.priority].label)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                        )}
                      >
                        {t(
                          `encounter_class__${item.encounter.encounter_class}`,
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{item.count}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Handle view details
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
