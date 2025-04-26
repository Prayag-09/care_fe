import { Beaker, FileText, FoldVertical, UnfoldVertical } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

import { SpecimenRead, SpecimenStatus } from "@/types/emr/specimen/specimen";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

interface SpecimenSectionProps {
  requirement: SpecimenDefinitionRead;
  matchingSpecimens: SpecimenRead[];
  onCollect: () => void;
}

export function SpecimenSection({
  requirement,
  matchingSpecimens = [],
  onCollect,
}: SpecimenSectionProps) {
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const getStatusBadge = (status: SpecimenStatus) => (
    <Badge
      variant="outline"
      className={cn(
        status === SpecimenStatus.available && "bg-green-50",
        status === SpecimenStatus.unavailable && "bg-red-50",
        status === SpecimenStatus.unsatisfactory && "bg-yellow-50",
      )}
    >
      {status}
    </Badge>
  );

  return (
    <div className="rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{requirement.title}</h3>
          <div className="flex gap-2">
            <Badge
              variant="outline"
              className={cn(
                matchingSpecimens.length > 0 ? "bg-green-50" : "bg-yellow-50",
              )}
            >
              {matchingSpecimens.length} Specimen(s)
            </Badge>
            {requirement.type_collected?.display && (
              <Badge variant="outline" className="bg-blue-50">
                {requirement.type_collected.display}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="divide-y">
        {/* Collection Requirements */}
        <Collapsible
          open={openSections.includes("requirements")}
          onOpenChange={() => toggleSection("requirements")}
        >
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Collection Requirements</span>
              </div>
              {openSections.includes("requirements") ? (
                <FoldVertical className="h-4 w-4" />
              ) : (
                <UnfoldVertical className="h-4 w-4" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 py-3 bg-gray-50">
            <div className="space-y-4">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">
                      Collection Method
                    </TableCell>
                    <TableCell>
                      {requirement.collection?.display || "Not specified"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      Patient Preparation
                    </TableCell>
                    <TableCell>
                      {requirement.patient_preparation
                        ?.map((prep) => prep.display)
                        .join(", ") || "No special preparation required"}
                    </TableCell>
                  </TableRow>
                  {requirement.type_tested?.container && (
                    <>
                      <TableRow>
                        <TableCell className="font-medium">Container</TableCell>
                        <TableCell>
                          {requirement.type_tested.container.description ||
                            "Not specified"}
                        </TableCell>
                      </TableRow>
                      {requirement.type_tested.container.capacity && (
                        <TableRow>
                          <TableCell className="font-medium">
                            Capacity
                          </TableCell>
                          <TableCell>
                            {requirement.type_tested.container.capacity.value}{" "}
                            {
                              requirement.type_tested.container.capacity.unit
                                .display
                            }
                          </TableCell>
                        </TableRow>
                      )}
                      {requirement.type_tested.container.minimum_volume
                        ?.quantity && (
                        <TableRow>
                          <TableCell className="font-medium">
                            Minimum Volume
                          </TableCell>
                          <TableCell>
                            {
                              requirement.type_tested.container.minimum_volume
                                .quantity.value
                            }{" "}
                            {
                              requirement.type_tested.container.minimum_volume
                                .quantity.unit.display
                            }
                          </TableCell>
                        </TableRow>
                      )}
                      {requirement.type_tested.container.preparation && (
                        <TableRow>
                          <TableCell className="font-medium">
                            Preparation
                          </TableCell>
                          <TableCell>
                            {requirement.type_tested.container.preparation}
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )}
                  {requirement.type_tested?.requirement && (
                    <TableRow>
                      <TableCell className="font-medium">
                        Requirements
                      </TableCell>
                      <TableCell>
                        {requirement.type_tested.requirement}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Specimens List */}
        {matchingSpecimens.map((specimen) => (
          <div key={specimen.id} className="divide-y">
            {/* Basic Info */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    {specimen.accession_identifier || specimen.id}
                  </span>
                  {getStatusBadge(specimen.status)}
                </div>
                <div className="text-sm text-gray-500">
                  {specimen.received_time &&
                    `Received: ${new Date(specimen.received_time).toLocaleString()}`}
                </div>
              </div>

              {/* Collection Details */}
              {specimen.collection && (
                <div className="space-y-2">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">
                          Collected By
                        </TableCell>
                        <TableCell>
                          {specimen.collection.collector || "-"}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">
                          Collection Time
                        </TableCell>
                        <TableCell>
                          {specimen.collection.collected_date_time &&
                            new Date(
                              specimen.collection.collected_date_time,
                            ).toLocaleString()}
                        </TableCell>
                      </TableRow>
                      {specimen.collection.body_site && (
                        <TableRow>
                          <TableCell className="font-medium">
                            Body Site
                          </TableCell>
                          <TableCell>
                            {specimen.collection.body_site.display}
                          </TableCell>
                        </TableRow>
                      )}
                      {specimen.collection.quantity && (
                        <TableRow>
                          <TableCell className="font-medium">
                            Quantity
                          </TableCell>
                          <TableCell>
                            {specimen.collection.quantity.value}{" "}
                            {specimen.collection.quantity.unit.display}
                          </TableCell>
                        </TableRow>
                      )}
                      {specimen.collection.method && (
                        <TableRow>
                          <TableCell className="font-medium">Method</TableCell>
                          <TableCell>
                            {specimen.collection.method.display}
                          </TableCell>
                        </TableRow>
                      )}
                      {specimen.collection.fasting_status_codeable_concept && (
                        <TableRow>
                          <TableCell className="font-medium">
                            Fasting Status
                          </TableCell>
                          <TableCell>
                            {
                              specimen.collection
                                .fasting_status_codeable_concept.display
                            }
                            {specimen.collection.fasting_status_duration && (
                              <span className="ml-2">
                                (
                                {
                                  specimen.collection.fasting_status_duration
                                    .value
                                }{" "}
                                {
                                  specimen.collection.fasting_status_duration
                                    .unit.display
                                }
                                )
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Processing Steps */}
            {specimen.processing.length > 0 && (
              <Collapsible
                open={openSections.includes(`processing-${specimen.id}`)}
                onOpenChange={() => toggleSection(`processing-${specimen.id}`)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Beaker className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Processing Steps</span>
                    </div>
                    {openSections.includes(`processing-${specimen.id}`) ? (
                      <FoldVertical className="h-4 w-4" />
                    ) : (
                      <UnfoldVertical className="h-4 w-4" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 py-3">
                  <div className="space-y-4">
                    {specimen.processing.map((process, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">
                            {process.method?.display || "Processing Step"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {process.time_date_time &&
                              new Date(process.time_date_time).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-sm">{process.description}</div>
                        {process.performer && (
                          <div className="text-sm text-gray-500 mt-2">
                            Performed by: {process.performer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Conditions */}
            {specimen.condition.length > 0 && (
              <div className="p-4">
                <h4 className="text-sm font-medium mb-2">Conditions</h4>
                <div className="flex flex-wrap gap-2">
                  {specimen.condition.map((condition, index) => (
                    <Badge key={index} variant="outline">
                      {condition.display}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {specimen.note && (
              <div className="p-4">
                <h4 className="text-sm font-medium mb-2">Notes</h4>
                <div className="text-sm bg-gray-50 p-3 rounded-lg">
                  {specimen.note}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Collect Button */}
        <div className="p-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onCollect}
            className="w-full"
          >
            Collect New Specimen
          </Button>
        </div>
      </div>
    </div>
  );
}
