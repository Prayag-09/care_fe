import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronsDownUp,
  ChevronsUpDown,
  FileCheck2,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";

import { Avatar } from "@/components/Common/Avatar";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { DiagnosticReportResultsTable } from "@/pages/Facility/services/diagnosticReports/components/DiagnosticReportResultsTable";
import {
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";

interface DiagnosticReportReviewProps {
  facilityId: string;
  serviceRequestId: string;
  diagnosticReports: DiagnosticReportRead[];
}

export function DiagnosticReportReview({
  facilityId,
  serviceRequestId,
  diagnosticReports,
}: DiagnosticReportReviewProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const queryClient = useQueryClient();
  const latestReport = diagnosticReports[0];

  // Fetch the full diagnostic report to get observations
  const { data: fullReport, isLoading: isLoadingReport } = useQuery({
    queryKey: ["diagnosticReport", latestReport?.id],
    queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
      pathParams: {
        facility_external_id: facilityId,
        external_id: latestReport?.id || "",
      },
    }),
    enabled: !!latestReport?.id,
  });

  const { mutate: updateDiagnosticReport, isPending: isUpdatingReport } =
    useMutation({
      mutationFn: mutate(diagnosticReportApi.updateDiagnosticReport, {
        pathParams: {
          facility_external_id: facilityId,
          external_id: latestReport?.id || "",
        },
      }),
      onSuccess: () => {
        toast.success("Diagnostic report approved successfully");
        queryClient.invalidateQueries({
          queryKey: ["serviceRequest", serviceRequestId],
        });
        // Fetch the updated report
        queryClient.invalidateQueries({
          queryKey: ["diagnosticReport", latestReport?.id],
        });
      },
      onError: (err: any) => {
        toast.error(
          `Failed to approve diagnostic report: ${err.message || "Unknown error"}`,
        );
      },
    });

  const handleApprove = () => {
    if (latestReport) {
      updateDiagnosticReport({
        ...latestReport,
        status: DiagnosticReportStatus.final,
      });
    }
  };

  if (!latestReport) {
    return null;
  }

  // Show loading state while fetching the report
  if (isLoadingReport) {
    return (
      <Card className="shadow-lg border-t-4 border-t-primary">
        <CardContent className="p-4">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (fullReport?.observations.length === 0) {
    return null;
  }

  return (
    <Card
      className={cn(
        "shadow-none border-gray-300 rounded-lg cursor-pointer bg-white",
        isExpanded && "bg-gray-100",
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild className="px-2 py-4">
          <CardHeader>
            <div className="flex justify-between items-center rounded-md">
              <div className="flex items-center gap-2">
                <CardTitle>
                  <p className="flex items-center gap-1.5">
                    <FileCheck2 className="size-[24px] text-gray-950 font-normal text-base stroke-[1.5px]" />{" "}
                    {fullReport?.code ? (
                      <p className="flex flex-col gap-1">
                        {fullReport?.code?.display} <br />
                        {isExpanded && (
                          <span className="text-sm text-gray-500">
                            {fullReport?.code?.system} {", "}{" "}
                            {fullReport?.code?.code}
                          </span>
                        )}
                      </p>
                    ) : (
                      <span className="text-base/9 text-gray-950 font-medium">
                        {t("result_review")}
                      </span>
                    )}
                  </p>
                </CardTitle>
              </div>
              <div className="flex items-center gap-5">
                {fullReport?.created_by && (
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={
                        fullReport.created_by.first_name ||
                        fullReport.created_by.username ||
                        ""
                      }
                      className="size-5"
                      imageUrl={fullReport.created_by.profile_picture_url}
                    />
                    <span className="text-sm/9 text-gray-700 font-medium">
                      {fullReport.created_by.first_name || ""}{" "}
                      {fullReport.created_by.last_name || ""}
                    </span>
                  </div>
                )}
                {fullReport && (
                  <Badge
                    className={
                      fullReport.status === DiagnosticReportStatus.final
                        ? "bg-green-100 text-green-800"
                        : "bg-pink-100 text-pink-800"
                    }
                    variant="outline"
                  >
                    {t(fullReport.status)}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 border border-gray-400 bg-white shadow p-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? (
                    <ChevronsDownUp className="size-5" />
                  ) : (
                    <ChevronsUpDown className="size-5" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="px-2 bg-gray-100">
            {fullReport && (
              <div className="space-y-6">
                <Card className="shadow-none rounded-lg border-gray-200 bg-gray-50">
                  <CardContent className="p-4">
                    <DiagnosticReportResultsTable
                      observations={fullReport.observations}
                    />
                  </CardContent>
                </Card>

                {fullReport?.status === DiagnosticReportStatus.preliminary && (
                  <div className="flex justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="primary"
                          disabled={isUpdatingReport}
                          className="gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Approve Results
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to approve these diagnostic
                            results? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleApprove}>
                            Approve
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
