import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader } from "lucide-react";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";

import { DiagnosticReportResultsTable } from "./components/DiagnosticReportResultsTable";

export default function DiagnosticReportPrint({
  facilityId,
  diagnosticReportId,
}: {
  facilityId: string;
  diagnosticReportId: string;
}) {
  const { t } = useTranslation();

  const { data: report, isLoading } = useQuery({
    queryKey: ["diagnosticReport", diagnosticReportId],
    queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
      pathParams: {
        facility_external_id: facilityId,
        external_id: diagnosticReportId,
      },
    }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          {t("diagnostic_report_not_found")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center">
      <PrintPreview
        title={`${t("diagnostic_report")} - ${report.code?.display || "diagnostic_report"}`}
      >
        <div className="min-h-screen py-8 max-w-4xl mx-auto">
          {/* Header with Facility Name and Logo */}
          <div className="flex justify-between items-start pb-6 border-b border-gray-200">
            <div className="space-y-4 flex-1">
              <div>
                <h1 className="text-3xl font-semibold">
                  {report.encounter?.facility?.name}
                </h1>
                <h2 className="text-gray-500 uppercase text-sm tracking-wide font-semibold mt-1">
                  {t("diagnostic_report")}
                </h2>
              </div>
            </div>
            <img
              src={careConfig.mainLogo?.dark}
              alt="Care Logo"
              className="h-10 w-auto object-contain ml-6"
            />
          </div>

          {/* Patient Details */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
              <span className="text-gray-600">{t("patient")}</span>
              <span className="text-gray-600">:</span>
              <span className="font-semibold break-words">
                {report.encounter?.patient?.name}
              </span>
            </div>
            <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
              <span className="text-gray-600">{t("category")}</span>
              <span className="text-gray-600">:</span>
              <span className="font-semibold break-words">
                {report.category?.display || "-"}
              </span>
            </div>
            <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
              <span className="text-gray-600">{t("status")}</span>
              <span className="text-gray-600">:</span>
              <span className="font-semibold capitalize">
                {t(report.status)}
              </span>
            </div>

            <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
              <span className="text-gray-600">{t("date")}</span>
              <span className="text-gray-600">:</span>
              <span className="font-semibold">
                {report.encounter?.created_date &&
                  format(
                    new Date(report.encounter.created_date),
                    "dd MMM yyyy, EEEE",
                  )}
              </span>
            </div>
            <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
              <span className="text-gray-600">{t("report_created_by")}</span>
              <span className="text-gray-600">:</span>
              <span className="font-semibold">
                {formatName(report.created_by)}
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-8">
            {/* Test Results */}
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {t("test_results")}
              </h2>
              <DiagnosticReportResultsTable
                observations={report.observations}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            {report.note && (
              <div className="col-span-full">
                <div className="text-sm font-medium text-gray-500 mb-1">
                  {t("notes")}
                </div>
                <div className="whitespace-pre-wrap text-sm">{report.note}</div>
              </div>
            )}
            {report.conclusion && (
              <div className="col-span-full">
                <div className="text-sm font-medium text-gray-500 mb-1">
                  {t("conclusion")}
                </div>
                <div className="whitespace-pre-wrap text-sm">
                  {report.conclusion}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-4 border-t text-[10px] text-gray-500 flex justify-between">
            <p>
              {t("generated_on")} {format(new Date(), "PPP 'at' p")}
            </p>
            <p>
              {t("generated_by")} {formatName(report.created_by)}
            </p>
          </div>
        </div>
      </PrintPreview>
    </div>
  );
}
