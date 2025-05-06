"use client";

import { Info, QrCode, Scan /* User */ } from "lucide-react";
// Remove User icon
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

// Change to default import
import useAuthUser from "@/hooks/useAuthUser";

import {
  CollectionSpec,
  SpecimenFromDefinitionCreate,
  SpecimenStatus,
} from "@/types/emr/specimen/specimen";
import type { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";
import { Code } from "@/types/questionnaire/code";

interface SpecimenFormProps {
  specimenDefinition: SpecimenDefinitionRead;
  onSubmit: (specimen: SpecimenFromDefinitionCreate) => void;
  onCancel: () => void;
}

export function SpecimenForm({
  specimenDefinition,
  onSubmit,
  onCancel,
}: SpecimenFormProps) {
  const authUser = useAuthUser(); // Correctly destructure user
  const currentUserId = authUser.external_id; // Get user ID

  const [identifierMode, setIdentifierMode] = useState<"scan" | "generate">(
    "generate",
  );

  const [specimenData, setSpecimenData] = useState<
    Omit<SpecimenFromDefinitionCreate, "specimen"> & {
      specimen: Omit<
        SpecimenFromDefinitionCreate["specimen"],
        "processing" | "condition"
      >;
    }
  >({
    specimen_definition: specimenDefinition.id,
    specimen: {
      status: SpecimenStatus.available,
      specimen_type: specimenDefinition.type_collected,
      accession_identifier: "",
      received_time: null,
      collection: {
        method: specimenDefinition.collection,
        body_site: null,
        collector: currentUserId || null, // Use user ID, default to null if not available yet
        collected_date_time: new Date().toISOString(),
        quantity: null,
        procedure: null,
        fasting_status_codeable_concept: null,
        fasting_status_duration: null,
      },
      note: null,
    },
  });

  const handleScanBarcode = () => {
    toast.info("Barcode scanning to be implemented");
  };

  const handleCollectionChange = (field: keyof CollectionSpec, value: any) => {
    setSpecimenData((prev) => ({
      ...prev,
      specimen: {
        ...prev.specimen,
        collection: prev.specimen.collection
          ? {
              ...prev.specimen.collection,
              [field]: value,
            }
          : null,
      },
    }));
  };

  const handleSpecimenChange = (
    field: keyof SpecimenFromDefinitionCreate["specimen"],
    value: any,
  ) => {
    setSpecimenData((prev) => ({
      ...prev,
      specimen: {
        ...prev.specimen,
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure collector ID is available before submitting
    if (!currentUserId) {
      toast.error("Collector information not available. Please try again.");
      return;
    }

    let finalData = { ...specimenData };
    if (identifierMode === "generate") {
      finalData = {
        ...finalData,
        specimen: {
          ...finalData.specimen,
          accession_identifier: "",
        },
      };
    }
    const submissionPayload: SpecimenFromDefinitionCreate = {
      specimen_definition: finalData.specimen_definition,
      specimen: {
        ...finalData.specimen,
        processing: [],
        condition: [],
        collection: {
          ...(finalData.specimen.collection ?? {
            method: null,
            collected_date_time: null,
            quantity: null,
            procedure: null,
            body_site: null,
            fasting_status_codeable_concept: null,
            fasting_status_duration: null,
          }),
          collector: currentUserId, // Use confirmed user ID
        },
      },
    };
    onSubmit(submissionPayload);
  };

  return (
    <div>
      <form className="space-y-8" onSubmit={handleSubmit}>
        <div>
          <div className="font-medium text-lg mb-2">Sample Identification</div>
          <Tabs
            value={identifierMode}
            onValueChange={(v) => setIdentifierMode(v as "scan" | "generate")}
            defaultValue="generate"
          >
            <TabsList className="w-full">
              <TabsTrigger
                value="generate"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                Generate Barcode
              </TabsTrigger>
              <TabsTrigger
                value="scan"
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Scan className="h-4 w-4" />
                Scan Existing
              </TabsTrigger>
            </TabsList>
            <TabsContent value="generate">
              <div className="rounded-lg border-2 border-dashed p-4 text-center bg-gray-50">
                <QrCode className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                <p className="text-sm text-gray-500">
                  A new barcode will be generated automatically when the
                  specimen is created
                </p>
              </div>
            </TabsContent>
            <TabsContent value="scan">
              <div className="flex gap-2">
                <Input
                  value={specimenData.specimen.accession_identifier}
                  onChange={(e) =>
                    handleSpecimenChange("accession_identifier", e.target.value)
                  }
                  placeholder="Scan or enter existing barcode"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleScanBarcode}
                >
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <div className="space-y-4">
          <div className="font-medium text-lg mb-2">Collection Information</div>
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-700">
                  Collection Date & Time
                </Label>
                <Input
                  className="h-9"
                  type="datetime-local"
                  value={
                    specimenData.specimen.collection?.collected_date_time?.split(
                      ".",
                    )[0] || ""
                  }
                  onChange={(e) =>
                    handleCollectionChange(
                      "collected_date_time",
                      e.target.value
                        ? new Date(e.target.value).toISOString()
                        : null,
                    )
                  }
                />
              </div>
              <div>
                <Label className="text-sm text-gray-700">Quantity</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Value"
                    className="max-w-36 h-9"
                    value={
                      specimenData.specimen.collection?.quantity?.value ?? ""
                    }
                    onChange={(e) =>
                      handleCollectionChange("quantity", {
                        ...(specimenData.specimen.collection?.quantity ?? {}),
                        value: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                        unit: specimenData.specimen.collection?.quantity?.unit,
                      })
                    }
                    step="any"
                  />
                  <div className="flex-1">
                    <ValueSetSelect
                      system="system-ucum-units"
                      placeholder="Unit"
                      onSelect={(code: Code | null) =>
                        handleCollectionChange("quantity", {
                          ...(specimenData.specimen.collection?.quantity ?? {}),
                          value:
                            specimenData.specimen.collection?.quantity?.value ??
                            null,
                          unit: code,
                        })
                      }
                      value={specimenData.specimen.collection?.quantity?.unit}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm text-gray-700">Body Site</Label>
              <ValueSetSelect
                system="system-body-site"
                placeholder="Select body site"
                onSelect={(code: Code | null) =>
                  handleCollectionChange("body_site", code)
                }
                value={specimenData.specimen.collection?.body_site}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="col-span-1 md:col-span-4">
                <Label className="text-sm text-gray-700">Fasting Status</Label>
                <ValueSetSelect
                  system="system-fasting-status-code"
                  placeholder="Select status"
                  onSelect={(code: Code | null) =>
                    handleCollectionChange(
                      "fasting_status_codeable_concept",
                      code,
                    )
                  }
                  value={
                    specimenData.specimen.collection
                      ?.fasting_status_codeable_concept
                  }
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <Label className="text-sm text-gray-700">
                  Fasting Duration (optional)
                </Label>
                <Input
                  type="number"
                  placeholder="Duration value (e.g., 8)"
                  value={
                    specimenData.specimen.collection?.fasting_status_duration
                      ?.value ?? ""
                  }
                  onChange={(e) =>
                    handleCollectionChange("fasting_status_duration", {
                      ...(specimenData.specimen.collection
                        ?.fasting_status_duration ?? {}),
                      value: e.target.value ? parseFloat(e.target.value) : null,
                      unit: specimenData.specimen.collection
                        ?.fasting_status_duration?.unit ?? {
                        code: "h",
                        display: "hour",
                        system: "http://unitsofmeasure.org",
                      },
                    })
                  }
                />
              </div>
            </div>

            {specimenDefinition.type_tested?.container && (
              <div className="mt-4 rounded-lg border bg-gray-50 p-4">
                <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-600">
                  <Info className="h-4 w-4" />
                  Container Requirements
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Type: </span>
                    {specimenDefinition.type_tested.container.description}
                  </div>
                  {specimenDefinition.type_tested.container.capacity && (
                    <div>
                      <span className="text-gray-600">Capacity: </span>
                      {
                        specimenDefinition.type_tested.container.capacity.value
                      }{" "}
                      {
                        specimenDefinition.type_tested.container.capacity.unit
                          .display
                      }
                    </div>
                  )}
                  {specimenDefinition.type_tested.container.minimum_volume && (
                    <div>
                      <span className="text-gray-600">Minimum Volume: </span>
                      {specimenDefinition.type_tested.container.minimum_volume
                        .string ||
                        (specimenDefinition.type_tested.container.minimum_volume
                          .quantity &&
                          `${specimenDefinition.type_tested.container.minimum_volume.quantity.value} ${specimenDefinition.type_tested.container.minimum_volume.quantity.unit.display}`)}
                    </div>
                  )}
                  {specimenDefinition.type_tested.container.preparation && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Preparation: </span>
                      {specimenDefinition.type_tested.container.preparation}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Notes</Label>
              <Textarea
                placeholder="Add any additional notes about the collection..."
                value={specimenData.specimen.note ?? ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleSpecimenChange("note", e.target.value || null)
                }
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">Collect Specimen</Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
