"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import {
  CollectionSpec,
  type ProcessingSpec,
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
  const [specimen, setSpecimen] = useState<SpecimenFromDefinitionCreate>({
    specimen_definition: specimenDefinition.id,
    specimen: {
      status: SpecimenStatus.available,
      specimen_type: specimenDefinition.type_collected,
      accession_identifier: [],
      received_time: null,
      collection: specimenDefinition.collection
        ? {
            collector: null,
            collected_date_time: null,
            quantity: null,
            method: specimenDefinition.collection,
            procedure: null,
            body_site: null,
            fasting_status_codeable_concept: null,
            fasting_status_duration: null,
          }
        : null,
      processing: [],
      condition: [],
      note: null,
    },
  });

  const [accessionId, setAccessionId] = useState("");
  const [processing, setProcessing] = useState<ProcessingSpec>({
    description: "",
    method: null,
    performer: null,
    time_date_time: null,
  });
  const [selectedCondition, setSelectedCondition] = useState<Code | null>(null);

  const handleStatusChange = (value: SpecimenStatus) => {
    setSpecimen({
      ...specimen,
      specimen: {
        ...specimen.specimen,
        status: value,
      },
    });
  };

  const handleAddAccessionId = () => {
    if (accessionId.trim()) {
      setSpecimen({
        ...specimen,
        specimen: {
          ...specimen.specimen,
          accession_identifier: [
            ...specimen.specimen.accession_identifier,
            accessionId.trim(),
          ],
        },
      });
      setAccessionId("");
    }
  };

  const handleAddProcessing = () => {
    if (processing.description.trim()) {
      setSpecimen({
        ...specimen,
        specimen: {
          ...specimen.specimen,
          processing: [...specimen.specimen.processing, processing],
        },
      });
      setProcessing({
        description: "",
        method: null,
        performer: null,
        time_date_time: null,
      });
    }
  };

  const handleAddCondition = () => {
    if (selectedCondition) {
      setSpecimen({
        ...specimen,
        specimen: {
          ...specimen.specimen,
          condition: [...specimen.specimen.condition, selectedCondition],
        },
      });
      setSelectedCondition(null);
    }
  };

  const handleRemoveCondition = (index: number) => {
    setSpecimen({
      ...specimen,
      specimen: {
        ...specimen.specimen,
        condition: specimen.specimen.condition.filter((_, i) => i !== index),
      },
    });
  };

  const handleCollectionChange = (field: keyof CollectionSpec, value: any) => {
    setSpecimen({
      ...specimen,
      specimen: {
        ...specimen.specimen,
        collection: {
          ...specimen.specimen.collection!,
          [field]: value,
        },
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(specimen);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Specimen</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={specimen.specimen.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(SpecimenStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Specimen Type</Label>
              <div className="h-10 px-3 py-2 rounded-md border bg-muted">
                {specimen.specimen.specimen_type?.display || "Not specified"}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accession">Accession Identifier</Label>
              <div className="flex gap-2">
                <Input
                  id="accession"
                  placeholder="Enter identifier"
                  value={accessionId}
                  onChange={(e) => setAccessionId(e.target.value)}
                />
                <Button type="button" onClick={handleAddAccessionId}>
                  Add
                </Button>
              </div>
              {specimen.specimen.accession_identifier.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {specimen.specimen.accession_identifier.map((id, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {id}
                      <button
                        type="button"
                        className="ml-1 hover:text-destructive"
                        onClick={() => {
                          setSpecimen({
                            ...specimen,
                            specimen: {
                              ...specimen.specimen,
                              accession_identifier:
                                specimen.specimen.accession_identifier.filter(
                                  (_, i) => i !== index,
                                ),
                            },
                          });
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Collection Method</Label>
              <div className="h-10 px-3 py-2 rounded-md border bg-muted">
                {specimen.specimen.collection?.method?.display ||
                  "Not specified"}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Collection Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Collection Method</Label>
                <div className="h-10 px-3 py-2 rounded-md border bg-muted">
                  {specimen.specimen.collection?.method?.display ||
                    "Not specified"}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="collector">Collector</Label>
                <Input
                  id="collector"
                  placeholder="Enter collector name"
                  value={specimen.specimen.collection?.collector || ""}
                  onChange={(e) =>
                    handleCollectionChange("collector", e.target.value || null)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="collected_date_time">
                  Collection Date & Time
                </Label>
                <Input
                  id="collected_date_time"
                  type="datetime-local"
                  value={
                    specimen.specimen.collection?.collected_date_time || ""
                  }
                  onChange={(e) =>
                    handleCollectionChange(
                      "collected_date_time",
                      e.target.value,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Body Site</Label>
                <ValueSetSelect
                  system="body-site"
                  placeholder="Select body site"
                  onSelect={(code) => handleCollectionChange("body_site", code)}
                  value={specimen.specimen.collection?.body_site}
                />
              </div>

              <div className="space-y-2">
                <Label>Procedure</Label>
                <ValueSetSelect
                  system="procedure-code"
                  placeholder="Select procedure"
                  onSelect={(code) => handleCollectionChange("procedure", code)}
                  value={specimen.specimen.collection?.procedure}
                />
              </div>

              <div className="space-y-2">
                <Label>Fasting Status</Label>
                <ValueSetSelect
                  system="fasting-status"
                  placeholder="Select fasting status"
                  onSelect={(code) =>
                    handleCollectionChange(
                      "fasting_status_codeable_concept",
                      code,
                    )
                  }
                  value={
                    specimen.specimen.collection
                      ?.fasting_status_codeable_concept
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Fasting Duration</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Duration"
                    value={
                      specimen.specimen.collection?.fasting_status_duration
                        ?.value || ""
                    }
                    onChange={(e) =>
                      handleCollectionChange("fasting_status_duration", {
                        ...specimen.specimen.collection
                          ?.fasting_status_duration,
                        value: parseFloat(e.target.value),
                      })
                    }
                  />
                  <ValueSetSelect
                    system="duration-units"
                    placeholder="Unit"
                    onSelect={(code) =>
                      handleCollectionChange("fasting_status_duration", {
                        ...specimen.specimen.collection
                          ?.fasting_status_duration,
                        unit: code,
                      })
                    }
                    value={
                      specimen.specimen.collection?.fasting_status_duration
                        ?.unit
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={specimen.specimen.collection?.quantity?.value || ""}
                    onChange={(e) =>
                      handleCollectionChange("quantity", {
                        ...specimen.specimen.collection?.quantity,
                        value: parseFloat(e.target.value),
                      })
                    }
                  />
                  <ValueSetSelect
                    system="specimen-quantity-units"
                    placeholder="Unit"
                    onSelect={(code) =>
                      handleCollectionChange("quantity", {
                        ...specimen.specimen.collection?.quantity,
                        unit: code,
                      })
                    }
                    value={specimen.specimen.collection?.quantity?.unit}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Processing</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter description"
                  value={processing.description}
                  onChange={(e) =>
                    setProcessing({
                      ...processing,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Method</Label>
                <ValueSetSelect
                  system="specimen-processing-method"
                  placeholder="Select processing method"
                  onSelect={(code) =>
                    setProcessing({
                      ...processing,
                      method: code,
                    })
                  }
                  value={processing.method}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="performer">Performer</Label>
                <Input
                  id="performer"
                  placeholder="Enter performer"
                  value={processing.performer || ""}
                  onChange={(e) =>
                    setProcessing({
                      ...processing,
                      performer: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_date_time">Time</Label>
                <Input
                  id="time_date_time"
                  type="datetime-local"
                  value={processing.time_date_time || ""}
                  onChange={(e) =>
                    setProcessing({
                      ...processing,
                      time_date_time: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={handleAddProcessing}>
                Add Processing
              </Button>
            </div>

            {specimen.specimen.processing.length > 0 && (
              <div className="space-y-2">
                <Label>Added Processing Steps</Label>
                <div className="space-y-2">
                  {specimen.specimen.processing.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-md border"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <p className="font-medium">{step.description}</p>
                          {step.method && (
                            <p className="text-sm text-muted-foreground">
                              Method: {step.method.display}
                            </p>
                          )}
                          {step.performer && (
                            <p className="text-sm text-muted-foreground">
                              Performer: {step.performer}
                            </p>
                          )}
                          {step.time_date_time && (
                            <p className="text-sm text-muted-foreground">
                              Time:{" "}
                              {new Date(step.time_date_time).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSpecimen({
                            ...specimen,
                            specimen: {
                              ...specimen.specimen,
                              processing: specimen.specimen.processing.filter(
                                (_, i) => i !== index,
                              ),
                            },
                          });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Conditions</h4>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Add Condition</Label>
                <div className="flex gap-2">
                  <ValueSetSelect
                    system="system-specimen-condition-code"
                    placeholder="Select condition"
                    onSelect={setSelectedCondition}
                    value={selectedCondition}
                  />
                  <Button type="button" onClick={handleAddCondition}>
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {specimen.specimen.condition.length > 0 && (
              <div className="space-y-2">
                <Label>Added Conditions</Label>
                <div className="flex flex-wrap gap-2">
                  {specimen.specimen.condition.map((condition, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {condition.display}
                      <button
                        type="button"
                        className="ml-1 hover:text-destructive"
                        onClick={() => handleRemoveCondition(index)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">Create Specimen</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
