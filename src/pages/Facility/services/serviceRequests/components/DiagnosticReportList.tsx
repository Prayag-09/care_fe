import { formatDistanceToNow } from "date-fns";
import { ClipboardCheck, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import {
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";

interface DiagnosticReportListProps {
  reports: DiagnosticReportRead[];
  onCreateReport: () => void;
  onViewReport: (reportId: string) => void;
}

export function DiagnosticReportList({
  reports,
  onCreateReport,
  onViewReport,
}: DiagnosticReportListProps) {
  // Helper to get status badge color
  const getStatusBadge = (status: DiagnosticReportStatus) => {
    switch (status) {
      case DiagnosticReportStatus.final:
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            Final
          </Badge>
        );
      case DiagnosticReportStatus.preliminary:
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">
            Preliminary
          </Badge>
        );
      case DiagnosticReportStatus.partial:
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            Partial
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Test Results</h2>
        <Button
          onClick={onCreateReport}
          disabled={
            reports.length > 0 &&
            reports.some((r) => r.status === DiagnosticReportStatus.final)
          }
        >
          <FileText className="h-4 w-4 mr-2" />
          {reports.length === 0 ? "Create Report" : "Update Report"}
        </Button>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <ClipboardCheck className="h-10 w-10 mx-auto mb-4 text-gray-400" />
            <p>No test results have been recorded yet.</p>
            <p className="mt-2 text-sm">
              Click "Create Report" to add test results.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Collapsible key={report.id} className="w-full">
              <Card>
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <CardTitle className="text-lg font-medium">
                        {report.code?.display || "Test Results"}
                      </CardTitle>
                      <div className="text-sm text-gray-500 mt-1">
                        Created{" "}
                        {formatDistanceToNow(new Date(), { addSuffix: true })}
                        {report.created_by &&
                          ` by ${report.created_by.first_name || ""} ${report.created_by.last_name || ""}`}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(report.status)}
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="p-4 pt-0">
                    <div className="space-y-4">
                      {report.observations?.map((observation) => (
                        <div key={observation.id} className="border-t pt-3">
                          <div className="flex justify-between">
                            <div className="font-medium">
                              {observation.observation_definition?.title ||
                                observation.main_code?.display ||
                                "Observation"}
                            </div>
                            <div className="flex space-x-2">
                              <div className="font-semibold">
                                {observation.value.value}{" "}
                                {observation.value.unit?.display ||
                                  observation.value.unit?.code}
                              </div>
                              {observation.interpretation === "normal" ? (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200"
                                >
                                  Normal
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-red-50 text-red-700 border-red-200"
                                >
                                  Abnormal
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {report.conclusion && (
                        <div className="border-t pt-3">
                          <div className="font-medium mb-1">Conclusion</div>
                          <p className="text-gray-700">{report.conclusion}</p>
                        </div>
                      )}

                      {report.note && (
                        <div className="border-t pt-3">
                          <div className="font-medium mb-1">Notes</div>
                          <p className="text-gray-700">{report.note}</p>
                        </div>
                      )}

                      <div className="flex justify-end pt-2">
                        <Button
                          variant="secondary"
                          onClick={() => onViewReport(report.id)}
                        >
                          Edit Results
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
