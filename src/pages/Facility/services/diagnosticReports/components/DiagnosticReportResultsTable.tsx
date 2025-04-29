import { t } from "i18next";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ObservationComponent,
  ObservationRead,
} from "@/types/emr/observation/observation";

interface DiagnosticReportResultsTableProps {
  observations: ObservationRead[];
}

export function DiagnosticReportResultsTable({
  observations,
}: DiagnosticReportResultsTableProps) {
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
            {!hasComponents && observation.interpretation && (
              <Badge
                variant="outline"
                className={
                  observation.interpretation === "normal"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }
              >
                {t(observation.interpretation)}
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

  if (!observations?.length) {
    return null;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">{t("test")}</TableHead>
            <TableHead className="font-semibold">{t("result")}</TableHead>
            <TableHead className="font-semibold">
              {t("reference_range")}
            </TableHead>
            <TableHead className="font-semibold">
              {t("interpretation")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {observations.map((observation) => renderObservation(observation))}
        </TableBody>
      </Table>
    </div>
  );
}
