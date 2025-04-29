import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import {
  ObservationComponent,
  ObservationRead,
} from "@/types/emr/observation/observation";

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

  const renderReferenceRange = (referenceRange: any) => {
    if (!referenceRange || !referenceRange[0]) return "-";
    const range = referenceRange[0];
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <span>
          {range.low?.value} - {range.high?.value}{" "}
          {range.low?.unit?.display || range.high?.unit?.display}
        </span>
      </div>
    );
  };

  const renderObservationComponents = (components: ObservationComponent[]) => {
    return components.map((component, index) => (
      <TableRow
        key={component.code?.code}
        className={`
          bg-gray-50/50 
          border-0
          ${index === components.length - 1 ? "border-b" : ""}
        `}
      >
        <TableCell className="pl-4 font-medium">
          <div className="flex items-center gap-1">
            <div className="w-2 h-px bg-gray-300" />
            {component.code?.display}
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <span>{component.value.value}</span>
            {component.value.unit && (
              <span className="text-gray-500">
                {component.value.unit.display}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell>{renderReferenceRange(component.reference_range)}</TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={
              component.interpretation === "normal"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }
          >
            {t(component.interpretation || "")}
          </Badge>
        </TableCell>
      </TableRow>
    ));
  };

  const renderObservation = (observation: ObservationRead) => {
    const hasComponents =
      observation.component && observation.component.length > 0;

    return (
      <>
        <TableRow
          key={observation.id}
          className={hasComponents ? "border-b-0" : ""}
        >
          <TableCell className="font-medium">
            {observation.observation_definition?.title ||
              observation.observation_definition?.code?.display}
          </TableCell>
          <TableCell>
            {!hasComponents && (
              <div className="flex items-center gap-2">
                <span>{observation.value.value}</span>
                {observation.value.unit && (
                  <span className="text-gray-500">
                    {observation.value.unit.display}
                  </span>
                )}
              </div>
            )}
          </TableCell>
          <TableCell>
            {!hasComponents &&
              renderReferenceRange(observation.reference_range)}
          </TableCell>
          <TableCell>
            {!hasComponents && (
              <Badge
                variant="outline"
                className={
                  observation.interpretation === "normal"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }
              >
                {t(observation.interpretation || "")}
              </Badge>
            )}
          </TableCell>
        </TableRow>
        {hasComponents &&
          observation.component &&
          renderObservationComponents(observation.component)}
      </>
    );
  };

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
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Test</TableHead>
                  <TableHead className="font-semibold">Result</TableHead>
                  <TableHead className="font-semibold">
                    Reference Range
                  </TableHead>
                  <TableHead className="font-semibold">
                    Interpretation
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fullReport?.observations?.map((observation) =>
                  renderObservation(observation),
                )}
              </TableBody>
            </Table>
          </div>

          {fullReport?.status === DiagnosticReportStatus.preliminary && (
            <div className="flex justify-end">
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
