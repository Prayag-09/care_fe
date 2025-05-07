import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Card } from "@/components/ui/card";

import { formatName } from "@/Utils/utils";
import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";
import { SpecimenRead } from "@/types/emr/specimen/specimen";

interface TimelineEvent {
  title: string;
  description: string;
  additional_info?: string;
  timestamp: string;
  status: "completed" | "pending" | "in_progress";
}

interface WorkflowProgressProps {
  request: ServiceRequestReadSpec;
}

function TimelineNode({ event }: { event: TimelineEvent }) {
  return (
    <div className="relative flex gap-8 pl-8 pt-0.5 group">
      <div className="absolute left-0 top-0 bottom-0 flex flex-col items-center">
        <div className="absolute w-px bg-gray-200 h-full top-4 group-last:hidden" />
        <div
          className={
            "size-6 rounded-full flex items-center justify-center bg-green-100"
          }
        >
          <CheckCircle2 className="size-4 text-green-600" />
        </div>
        {!event.status && <div className="flex-1 w-px bg-gray-200" />}
      </div>
      <div className="flex flex-col gap-1 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-medium text-base text-gray-900">
              {event.title}
            </h3>
            <p className="text-sm text-gray-500">{event.description}</p>
            <p className="text-sm text-gray-500">{event.additional_info}</p>
            <time className="text-sm text-gray-500 whitespace-nowrap">
              {format(new Date(event.timestamp), " hh:mm a, MMM d, yyyy")}
            </time>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WorkflowProgress({ request }: WorkflowProgressProps) {
  const events: TimelineEvent[] = [];

  // Add service request creation
  if (request.created_by && request.created_date) {
    events.push({
      title: "Service Request Created",
      description: `Request initiated by ${formatName(request.created_by)}`,
      timestamp: request.created_date,
      status: "completed",
    });
  }

  // Add specimen collection events
  request.specimens?.forEach((specimen: SpecimenRead) => {
    if (specimen.collection?.collected_date_time) {
      events.push({
        title: "Specimen Collected",
        description: `${specimen.specimen_type?.display || "Specimen"} collected`,
        timestamp: specimen.collection.collected_date_time,
        status: "completed",
      });
    }
  });

  // Add specimen processing events
  request.specimens?.forEach((specimen: SpecimenRead) => {
    specimen.processing.forEach((processing) => {
      if (processing.time_date_time) {
        events.push({
          title: "Specimen Processed",
          description: `${specimen.specimen_type?.display || "Specimen"} processed`,
          additional_info: `${processing.method?.display || "Method"}`,
          timestamp: processing.time_date_time,
          status: "completed",
        });
      }
    });
  });

  // Add diagnostic report events
  request.diagnostic_reports?.forEach((report: DiagnosticReportRead) => {
    events.push({
      title: "Diagnostic Report Generated",
      description: `Diagnostic report created`,
      timestamp: report.created_date,
      status: report.status === "final" ? "completed" : "in_progress",
    });
  });

  // Sort events by timestamp
  events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-6">
        <CareIcon icon="l-clipboard-alt" className="size-5" />
        <h2 className="text-lg font-semibold">Workflow Progress</h2>
      </div>
      <div className="space-y-2">
        {events.map((event, index) => (
          <TimelineNode key={index} event={event} />
        ))}
      </div>
    </Card>
  );
}
