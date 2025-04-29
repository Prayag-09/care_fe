import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import { Skeleton } from "@/components/ui/skeleton";

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
      <Card className="shadow-lg border">
        <CardHeader className="pb-0">
          <CardTitle>Test Results Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
    <Card className="shadow-lg border">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle>Test Results Review</CardTitle>
          <div className="flex items-center gap-2">
            {fullReport?.status === DiagnosticReportStatus.final && (
              <Badge variant="primary">Approved</Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {fullReport && (
            <DiagnosticReportResultsTable
              observations={fullReport.observations}
            />
          )}

          {fullReport?.status === DiagnosticReportStatus.preliminary && (
            <div className="mt-6 flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={isUpdatingReport} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Approve Results
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to approve these diagnostic results?
                      This action cannot be undone.
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
        </CardContent>
      )}
    </Card>
  );
}
