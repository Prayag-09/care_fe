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

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { EmptyState } from "@/components/definition-list/EmptyState";
import { FilterSelect } from "@/components/definition-list/FilterSelect";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import {
  ACTIVE_MEDICATION_STATUSES,
  INACTIVE_MEDICATION_STATUSES,
  MedicationPriority,
  MedicationRequestRead,
  displayMedicationName,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
  draft: "bg-gray-100 text-gray-700",
  "on-hold": "bg-amber-100 text-amber-700",
  unknown: "bg-gray-100 text-gray-700",
  ended: "bg-purple-100 text-purple-700",
};

const PRIORITY_COLORS: Record<string, string> = {
  routine: "bg-blue-100 text-blue-700",
  urgent: "bg-red-100 text-red-700",
  asap: "bg-amber-100 text-amber-700",
  stat: "bg-purple-100 text-purple-700",
};

interface MedicationTableProps {
  medications: MedicationRequestRead[];
}

function MedicationTable({ medications }: MedicationTableProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("medicine")}</TableHead>
            <TableHead>{t("dosage")}</TableHead>
            <TableHead>{t("frequency")}</TableHead>
            <TableHead>{t("duration")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("priority")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {medications.map((medication: MedicationRequestRead) => {
            const instruction = medication.dosage_instruction[0];
            const frequency = instruction?.timing?.code;
            const duration = instruction?.timing?.repeat?.bounds_duration;
            const dosage = instruction?.dose_and_rate?.dose_quantity;

            return (
              <TableRow key={medication.id}>
                <TableCell>{displayMedicationName(medication)}</TableCell>
                <TableCell>
                  {dosage ? `${dosage.value} ${dosage.unit.display}` : "-"}
                </TableCell>
                <TableCell>
                  {instruction?.as_needed_boolean
                    ? `${t("as_needed_prn")} ${
                        instruction?.as_needed_for?.display
                          ? `(${instruction.as_needed_for.display})`
                          : ""
                      }`
                    : frequency?.display || "-"}
                </TableCell>
                <TableCell>
                  {duration ? `${duration.value} ${duration.unit}` : "-"}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      STATUS_COLORS[medication.status],
                    )}
                  >
                    {t(medication.status)}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      PRIORITY_COLORS[medication.priority],
                    )}
                  >
                    {t(medication.priority)}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

interface Props {
  facilityId: string;
  patientId: string;
}

export default function MedicationDispenseList({
  facilityId,
  patientId,
}: Props) {
  const { t } = useTranslation();
  const { locationId } = useCurrentLocation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 100,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["medication_requests", qParams, patientId],
    queryFn: query(medicationRequestApi.list, {
      pathParams: { patientId },
      queryParams: {
        facility: facilityId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        search: qParams.search,
        status: qParams.status,
        priority: qParams.priority,
      },
    }),
  });

  const medications = response?.results || [];
  const medicationsWithProduct = medications.filter(
    (med) => med.requested_product,
  );
  const otherMedications = medications.filter((med) => !med.requested_product);

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-gray-900">
            {t("pharmacy_medications")}
          </h1>
          <Button
            onClick={() =>
              navigate(
                `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${patientId}/bill`,
              )
            }
            className="w-full sm:w-auto"
          >
            {t("bill_medications")}
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder={t("search_medications")}
              value={qParams.search}
              onChange={(e) => updateQuery({ search: e.target.value })}
              className="w-full"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial sm:w-auto">
              <FilterSelect
                value={qParams.status || ""}
                onValueChange={(value) => updateQuery({ status: value })}
                options={[
                  ...ACTIVE_MEDICATION_STATUSES,
                  ...INACTIVE_MEDICATION_STATUSES,
                ]}
                label="status"
                onClear={() => updateQuery({ status: undefined })}
              />
            </div>
            <div className="flex-1 sm:flex-initial sm:w-auto">
              <FilterSelect
                value={qParams.priority || ""}
                onValueChange={(value) => updateQuery({ priority: value })}
                options={Object.values(MedicationPriority)}
                label="priority"
                onClear={() => updateQuery({ priority: undefined })}
              />
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton count={5} />
      ) : medications.length === 0 ? (
        <EmptyState
          title={t("no_medications_found")}
          description={t("no_medications_found_description")}
          icon="l-tablets"
        />
      ) : (
        <div className="space-y-8">
          {medicationsWithProduct.length > 0 && (
            <div>
              <MedicationTable medications={medicationsWithProduct} />
            </div>
          )}

          {otherMedications.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  {t("other_medications")}
                </h2>
              </div>
              <MedicationTable medications={otherMedications} />
            </div>
          )}
          <div className="mt-4">
            <Pagination totalCount={response?.count || 0} />
          </div>
        </div>
      )}
    </div>
  );
}
