import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import { PrescriptionRead } from "@/types/emr/prescription/prescription";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";
import { ReceiptTextIcon } from "lucide-react";

interface PrescriptionListProps {
  patientId: string;
  encounterId: string;
  facilityId: string;
  selectedPrescriptionId?: string | undefined;
  onSelectPrescription: (prescription: PrescriptionRead) => void;
}

export default function PrescriptionList({
  patientId,
  encounterId,
  facilityId,
  selectedPrescriptionId,
  onSelectPrescription,
}: PrescriptionListProps) {
  const { t } = useTranslation();

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["prescriptions", patientId, encounterId],
    queryFn: query(prescriptionApi.list, {
      pathParams: { patientId },
      queryParams: {
        encounter: encounterId,
        facility: facilityId,
      },
    }),
    enabled: !!patientId && !!encounterId,
  });

  // Select first prescription by default
  React.useEffect(() => {
    if (prescriptions?.results?.length && !selectedPrescriptionId) {
      onSelectPrescription(prescriptions.results[0]);
    }
  }, [prescriptions, selectedPrescriptionId, onSelectPrescription]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!prescriptions?.results?.length) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="rounded-full bg-secondary/10 p-3">
          <ReceiptTextIcon className="text-3xl text-gray-500" />
        </div>
        <div className="max-w-[200px] space-y-1">
          <h3 className="font-medium">{t("no_prescriptions")}</h3>
          <p className="text-sm text-gray-500">{t("no_prescriptions_found")}</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-1 p-2">
        {prescriptions.results.map((prescription: PrescriptionRead) => {
          const isSelected = selectedPrescriptionId === prescription.id;
          return (
            <Card
              key={prescription.id}
              className={cn(
                "rounded-md relative cursor-pointer transition-colors w-full",
                isSelected
                  ? "bg-white border-primary-600 shadow-md"
                  : "bg-gray-100 hover:bg-gray-100 shadow-none",
              )}
              onClick={() => onSelectPrescription(prescription)}
            >
              {isSelected && (
                <div className="absolute right-0 h-8 w-1 bg-primary-600 rounded-l inset-y-1/2 -translate-y-1/2" />
              )}
              <CardContent className="flex flex-col px-4 py-3 gap-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-start gap-3">
                    <ReceiptTextIcon
                      className={cn(
                        "size-5",
                        isSelected ? "text-primary-600" : "text-gray-500",
                      )}
                    />
                    <div className="flex flex-col items-start">
                      <span className="text-base font-semibold">
                        {formatDateTime(
                          prescription.created_date,
                          "DD/MM/YYYY hh:mm A",
                        )}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {formatName(prescription.prescribed_by)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
