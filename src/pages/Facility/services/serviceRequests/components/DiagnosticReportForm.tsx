import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import { ChevronDown, ChevronUp, PlusCircle, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import { Skeleton } from "@/components/ui/skeleton";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  DiagnosticReportRead,
  DiagnosticReportStatus,
} from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import {
  ObservationComponent,
  ObservationFromDefinitionCreate,
  ObservationStatus,
  QuestionnaireSubmitResultValue,
} from "@/types/emr/observation/observation";
import observationApi from "@/types/emr/observation/observationApi";
import {
  ObservationDefinitionComponentSpec,
  ObservationDefinitionReadSpec,
} from "@/types/emr/observationDefinition/observationDefinition";
import { Code } from "@/types/questionnaire/code";

interface DiagnosticReportFormProps {
  facilityId: string;
  serviceRequestId: string;
  observationDefinitions: ObservationDefinitionReadSpec[];
  diagnosticReports: DiagnosticReportRead[];
}

// Interface for component values
interface ComponentValue {
  value: string;
  unit: string;
  isNormal: boolean;
}

// Interface for observation values
interface ObservationValue {
  id: string;
  value: string;
  unit: string;
  isNormal: boolean;
  components: Record<string, ComponentValue>;
}

export function DiagnosticReportForm({
  facilityId,
  serviceRequestId,
  observationDefinitions,
  diagnosticReports,
}: DiagnosticReportFormProps) {
  const [observations, setObservations] = useState<
    Record<string, ObservationValue>
  >({});
  const [isExpanded, setIsExpanded] = useState(true);
  const queryClient = useQueryClient();

  // Get the latest report if any exists
  const latestReport =
    diagnosticReports.length > 0 ? diagnosticReports[0] : null;
  const hasReport = !!latestReport;

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

  // Creating a new diagnostic report
  const { mutate: createDiagnosticReport, isPending: isCreatingReport } =
    useMutation({
      mutationFn: mutate(diagnosticReportApi.createDiagnosticReport, {
        pathParams: {
          facility_external_id: facilityId,
        },
      }),
      onSuccess: (data: DiagnosticReportRead) => {
        toast.success("Diagnostic report created successfully");
        queryClient.invalidateQueries({
          queryKey: ["serviceRequest", serviceRequestId],
        });
        // Fetch the newly created report
        queryClient.invalidateQueries({
          queryKey: ["diagnosticReport", data.id],
        });
      },
      onError: (err: any) => {
        toast.error(
          `Failed to create diagnostic report: ${err.message || "Unknown error"}`,
        );
      },
    });

  // Upserting observations for a diagnostic report
  const { mutate: upsertObservations, isPending: isUpsertingObservations } =
    useMutation({
      mutationFn: mutate(observationApi.upsertObservations, {
        pathParams: {
          facility_external_id: facilityId,
          external_id: latestReport?.id || "",
        },
      }),
      onSuccess: () => {
        toast.success("Test results saved successfully");
        queryClient.invalidateQueries({
          queryKey: ["serviceRequest", serviceRequestId],
        });
        queryClient.invalidateQueries({
          queryKey: ["diagnosticReport", latestReport?.id],
        });
      },
      onError: (err: any) => {
        toast.error(
          `Failed to save test results: ${err.message || "Unknown error"}`,
        );
      },
    });

  // Initialize form with existing observations from the full report
  useEffect(() => {
    if (fullReport?.observations && fullReport.observations.length > 0) {
      const initialObservations: Record<string, ObservationValue> = {};

      fullReport.observations.forEach((obs) => {
        if (obs.observation_definition) {
          const components: Record<string, ComponentValue> = {};

          // Initialize components if they exist
          if (obs.component && obs.component.length > 0) {
            obs.component.forEach((comp: ObservationComponent) => {
              if (comp.code) {
                components[comp.code.code] = {
                  value: comp.value.value || "",
                  unit: comp.value.unit?.code || "",
                  isNormal: comp.interpretation === "normal",
                };
              }
            });
          }

          initialObservations[obs.observation_definition.id] = {
            id: obs.id,
            value: obs.value.value || "",
            unit: obs.value.unit?.code || "",
            isNormal: obs.interpretation === "normal",
            components,
          };
        }
      });

      setObservations(initialObservations);

      // Set report status from the full report
    }
  }, [fullReport]);

  function handleValueChange(definitionId: string, value: string) {
    setObservations((prev) => ({
      ...prev,
      [definitionId]: {
        ...(prev[definitionId] || { unit: "", isNormal: true, components: {} }),
        value,
      },
    }));
  }

  function handleUnitChange(definitionId: string, unit: string) {
    setObservations((prev) => ({
      ...prev,
      [definitionId]: {
        ...(prev[definitionId] || {
          value: "",
          isNormal: true,
          components: {},
        }),
        unit,
      },
    }));
  }

  function handleNormalChange(definitionId: string, isNormal: boolean) {
    setObservations((prev) => ({
      ...prev,
      [definitionId]: {
        ...(prev[definitionId] || { value: "", unit: "", components: {} }),
        isNormal,
      },
    }));
  }

  function handleComponentValueChange(
    definitionId: string,
    componentCode: string,
    value: string,
    unit: string,
  ) {
    setObservations((prev) => {
      const observation = prev[definitionId] || {
        value: "",
        unit: "",
        isNormal: true,
        components: {},
      };
      const components = { ...observation.components };

      components[componentCode] = {
        ...(components[componentCode] || { isNormal: true }),
        value,
        unit,
      };

      return {
        ...prev,
        [definitionId]: {
          ...observation,
          components,
        },
      };
    });
  }

  function handleComponentUnitChange(
    definitionId: string,
    componentCode: string,
    unit: string,
  ) {
    setObservations((prev) => {
      const observation = prev[definitionId] || {
        value: "",
        unit: "",
        isNormal: true,
        components: {},
      };
      const components = { ...observation.components };

      components[componentCode] = {
        ...(components[componentCode] || { value: "", isNormal: true }),
        unit,
      };

      return {
        ...prev,
        [definitionId]: {
          ...observation,
          components,
        },
      };
    });
  }

  function handleComponentNormalChange(
    definitionId: string,
    componentCode: string,
    isNormal: boolean,
  ) {
    setObservations((prev) => {
      const observation = prev[definitionId] || {
        value: "",
        unit: "",
        isNormal: true,
        components: {},
      };
      const components = { ...observation.components };

      components[componentCode] = {
        ...(components[componentCode] || { value: "", unit: "" }),
        isNormal,
      };

      return {
        ...prev,
        [definitionId]: {
          ...observation,
          components,
        },
      };
    });
  }

  function handleCreateReport() {
    // Only create a new report if no reports exist
    if (!hasReport) {
      const category: Code = {
        code: "LAB",
        display: "Laboratory",
        system: "http://terminology.hl7.org/CodeSystem/v2-0074",
      };

      createDiagnosticReport({
        status: DiagnosticReportStatus.preliminary,
        category,
        service_request: serviceRequestId,
      });
    }
  }

  function handleSubmit() {
    if (!hasReport) {
      // First create a report if none exists
      handleCreateReport();
      return;
    }

    const formattedObservations: ObservationFromDefinitionCreate[] =
      Object.entries(observations)
        .map(([definitionId, obsData]) => {
          const observationDefinition = observationDefinitions.find(
            (def) => def.id === definitionId,
          );

          // If it's a component-based observation (like blood pressure), we should check if components have values
          const hasComponents =
            observationDefinition?.component &&
            observationDefinition.component.length > 0;
          const hasComponentValues =
            hasComponents &&
            Object.values(obsData.components).some(
              (comp) => comp.value.trim() !== "",
            );

          // For regular observations, skip if no value is entered
          // For component-based observations, check component values
          if (!hasComponents && !obsData.value.trim()) {
            return null;
          }

          if (hasComponents && !hasComponentValues) {
            return null;
          }

          const value: QuestionnaireSubmitResultValue = {
            value: obsData.value,
          };

          if (obsData.unit && observationDefinition?.permitted_unit) {
            value.unit = {
              code: obsData.unit,
              system: observationDefinition.permitted_unit.system,
              display:
                observationDefinition.permitted_unit.display || obsData.unit,
            };
          }

          // Create observation components if they exist and have values
          const components: ObservationComponent[] = [];

          if (hasComponents && observationDefinition) {
            observationDefinition.component.forEach(
              (componentDef: ObservationDefinitionComponentSpec) => {
                const componentCode = componentDef.code.code;
                const componentData = obsData.components[componentCode];

                if (componentData && componentData.value.trim()) {
                  const componentValue: QuestionnaireSubmitResultValue = {
                    value: componentData.value,
                  };

                  if (componentData.unit && componentDef.permitted_unit) {
                    componentValue.unit = {
                      code: componentData.unit,
                      system: componentDef.permitted_unit.system,
                      display:
                        componentDef.permitted_unit.display ||
                        componentData.unit,
                    };
                  }

                  components.push({
                    code: componentDef.code,
                    value: componentValue,
                    interpretation: componentData.isNormal
                      ? "normal"
                      : "abnormal",
                  });
                }
              },
            );
          }

          return {
            ...(obsData.id
              ? { observation_id: obsData.id }
              : { observation_definition: definitionId }),
            observation: {
              status: ObservationStatus.FINAL,
              subject_type: "patient",
              value_type: observationDefinition?.permitted_data_type || "float",
              effective_datetime: new Date().toISOString(),
              value,
              encounter: null,
              interpretation: obsData.isNormal ? "normal" : "abnormal",
              component: components.length > 0 ? components : undefined,
            },
          };
        })
        .filter(Boolean) as ObservationFromDefinitionCreate[];

    if (fullReport) {
      // Upsert observations
      if (formattedObservations.length > 0) {
        upsertObservations({
          observations: formattedObservations,
        });
      }
    }
  }

  // Helper to render component inputs for multi-component observations like blood pressure
  function renderComponentInputs(
    definition: ObservationDefinitionReadSpec,
    observationData: ObservationValue,
  ) {
    if (!definition.component || definition.component.length === 0) {
      return null;
    }

    return (
      <div className="space-y-4 mt-4">
        <Separator />
        {definition.component.map((component) => {
          const componentData = observationData.components[
            component.code.code
          ] || {
            value: "",
            unit: component.permitted_unit?.code,
            isNormal: true,
          };

          return (
            <div key={component.code.code} className="mt-2">
              <Label className="text-sm font-medium mb-1 block">
                {component.code.display || component.code.code}
              </Label>
              <div className="flex space-x-4 items-center">
                <div className="flex-1">
                  <Input
                    value={componentData.value}
                    onChange={(e) =>
                      handleComponentValueChange(
                        definition.id,
                        component.code.code,
                        e.target.value,
                        componentData.unit,
                      )
                    }
                    placeholder="Component value"
                    type={
                      component.permitted_data_type === "decimal" ||
                      component.permitted_data_type === "integer"
                        ? "number"
                        : "text"
                    }
                  />
                </div>

                {component.permitted_unit && (
                  <div className="w-32">
                    <Select
                      value={componentData.unit}
                      onValueChange={(unit) =>
                        handleComponentUnitChange(
                          definition.id,
                          component.code.code,
                          unit,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={component.permitted_unit.code}>
                          {component.permitted_unit.display ||
                            component.permitted_unit.code}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="w-32">
                  <Select
                    value={componentData.isNormal ? "normal" : "abnormal"}
                    onValueChange={(value) =>
                      handleComponentNormalChange(
                        definition.id,
                        component.code.code,
                        value === "normal",
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          Normal
                        </Badge>
                      </SelectItem>
                      <SelectItem value="abnormal">
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200"
                        >
                          Abnormal
                        </Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const isSubmitting = isCreatingReport || isUpsertingObservations;

  // Show loading state while fetching the report
  if (hasReport && isLoadingReport) {
    return (
      <Card className="shadow-lg border-t-4 border-t-primary">
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (fullReport?.status === DiagnosticReportStatus.final) {
    return null;
  }

  return (
    <Card className="shadow-lg border">
      <CardHeader className="pb-2 bg-gray-50 rounded-md">
        <div className="flex justify-between items-center rounded-md">
          <div className="flex items-center gap-2">
            <CardTitle>Test Results</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {hasReport && fullReport && (
              <Badge className={"bg-amber-100 text-amber-800"}>
                {t(fullReport.status)}
              </Badge>
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
        {hasReport && fullReport?.created_by && (
          <div className="text-sm text-gray-500 mt-1">
            Created by {fullReport.created_by.first_name || ""}{" "}
            {fullReport.created_by.last_name || ""}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="py-4">
          {hasReport && fullReport ? (
            <div className="space-y-6">
              {observationDefinitions.map((definition) => {
                const hasComponents =
                  definition.component && definition.component.length > 0;
                const observationData = observations[definition.id] || {
                  value: "",
                  unit: "",
                  isNormal: true,
                  components: {},
                };

                return (
                  <Card key={definition.id} className="mb-4">
                    <CardContent className="p-4">
                      <div className="grid gap-4">
                        <div className="flex justify-between items-start">
                          <Label className="text-base font-medium">
                            {definition.title || definition.code?.display}
                          </Label>
                        </div>

                        {/* For blood pressure and similar observations with components, we may or may not need to show the main value field */}
                        {(!hasComponents ||
                          definition.permitted_data_type !== "quantity") && (
                          <div className="flex space-x-4 items-center">
                            <div className="flex-1">
                              <Input
                                value={observationData.value}
                                onChange={(e) =>
                                  handleValueChange(
                                    definition.id,
                                    e.target.value,
                                  )
                                }
                                placeholder="Result value"
                                type={
                                  definition.permitted_data_type ===
                                    "decimal" ||
                                  definition.permitted_data_type === "integer"
                                    ? "number"
                                    : "text"
                                }
                              />
                            </div>

                            {definition.permitted_unit && (
                              <div className="w-32">
                                <Select
                                  value={observationData.unit}
                                  onValueChange={(unit) =>
                                    handleUnitChange(definition.id, unit)
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Unit" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem
                                      value={definition.permitted_unit.code}
                                    >
                                      {definition.permitted_unit.display ||
                                        definition.permitted_unit.code}
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                            <div className="w-32">
                              <Select
                                value={
                                  observationData.isNormal
                                    ? "normal"
                                    : "abnormal"
                                }
                                onValueChange={(value) =>
                                  handleNormalChange(
                                    definition.id,
                                    value === "normal",
                                  )
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="normal">
                                    <Badge
                                      variant="outline"
                                      className="bg-green-50 text-green-700 border-green-200"
                                    >
                                      Normal
                                    </Badge>
                                  </SelectItem>
                                  <SelectItem value="abnormal">
                                    <Badge
                                      variant="outline"
                                      className="bg-red-50 text-red-700 border-red-200"
                                    >
                                      Abnormal
                                    </Badge>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}

                        {/* Render component inputs for multi-component observations */}
                        {hasComponents &&
                          renderComponentInputs(definition, observationData)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {fullReport?.status === DiagnosticReportStatus.preliminary && (
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="default"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Results
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-gray-500">
                <p>No test results have been recorded yet.</p>
                <p className="mt-2 text-sm">
                  Click "Create Report" to add test results.
                </p>
              </div>
              <Button
                onClick={handleCreateReport}
                disabled={isCreatingReport}
                className="mx-auto"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
