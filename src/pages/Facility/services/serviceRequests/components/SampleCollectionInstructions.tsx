import { PackageSearch } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table";

import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

interface SampleCollectionInstructionsProps {
  requirements: SpecimenDefinitionRead[];
}

function formatQuantity(quantity: any): string {
  if (!quantity) return "N/A";
  if (quantity.string) return quantity.string;
  if (quantity.quantity?.value && quantity.quantity?.unit?.display) {
    return `${quantity.quantity.value} ${quantity.quantity.unit.display}`;
  }
  return "N/A";
}

export function SampleCollectionInstructions({
  requirements,
}: SampleCollectionInstructionsProps) {
  if (!requirements || requirements.length === 0) {
    return null; // Or show a placeholder message
  }

  // For simplicity, showing instructions from the first requirement
  // TODO: Handle multiple requirements if needed, maybe tabs or sections
  const requirement = requirements[0];
  const container = requirement.type_tested?.container;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <PackageSearch className="h-5 w-5" />
          Sample Collection Instructions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Specimen & Collection */}
        <div className="space-y-2">
          <h3 className="font-medium text-base">
            Specimen and Collection Details
          </h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="w-[200px]">Specimen Type</TableHead>
                <TableCell>
                  {requirement.type_collected?.display ?? "N/A"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Collection Method</TableHead>
                <TableCell>
                  {requirement.collection?.display ?? "N/A"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Patient Preparation</TableHead>
                <TableCell>
                  {requirement.patient_preparation &&
                  requirement.patient_preparation.length > 0
                    ? requirement.patient_preparation
                        .map((p) => p.display)
                        .join(", ")
                    : "N/A"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Container Information */}
        <div className="space-y-2">
          <h3 className="font-medium text-base">Container Information</h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="w-[200px]">Container Type</TableHead>
                <TableCell>{container?.cap?.display ?? "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Container Size</TableHead>
                <TableCell>
                  {container?.capacity
                    ? formatQuantity({ quantity: container.capacity })
                    : "N/A"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Minimum Volume</TableHead>
                <TableCell>
                  {container?.minimum_volume
                    ? formatQuantity(container.minimum_volume)
                    : "N/A"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Cap</TableHead>
                <TableCell>{container?.cap?.display ?? "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Container Preparation</TableHead>
                <TableCell>{container?.preparation ?? "N/A"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Processing & Storage */}
        <div className="space-y-2">
          <h3 className="font-medium text-base">Processing and Storage</h3>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="w-[200px]">
                  Processing Requirements
                </TableHead>
                {/* TODO: Add Processing requirements field to SpecimenDefinition Type */}
                <TableCell>
                  {
                    "N/A (Field missing)" /* requirement.processing_requirements ?? "N/A" */
                  }
                </TableCell>
              </TableRow>
              <TableRow>
                <TableHead>Retention Time</TableHead>
                <TableCell>
                  {requirement.type_tested?.retention_time
                    ? `${requirement.type_tested.retention_time.value} ${requirement.type_tested.retention_time.unit.display}`
                    : "N/A"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
