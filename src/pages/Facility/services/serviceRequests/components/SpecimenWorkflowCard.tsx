import { useMutation, useQueryClient } from "@tanstack/react-query";
import { t } from "i18next";
import {
  Barcode,
  ChevronsDownUp,
  ChevronsUpDown,
  CircleDashed,
  Droplet,
  FileText,
  PackageSearch,
  Plus,
  Receipt,
  ShieldCheck,
  TestTubeDiagonal,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

// Import Accordion components
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import useAuthUser from "@/hooks/useAuthUser";

import mutate from "@/Utils/request/mutate";
import { ProcessSpecimen } from "@/pages/Facility/services/serviceRequests/components/ProcessSpecimen";
import {
  ProcessingSpec,
  SpecimenRead,
  SpecimenStatus,
} from "@/types/emr/specimen/specimen";
import specimenApi from "@/types/emr/specimen/specimenApi";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

// --- Helper function (keep or move to utils) ---
function formatQuantity(quantity: any): string {
  if (!quantity) return "N/A";
  if (quantity.string) return quantity.string;
  if (quantity.quantity?.value && quantity.quantity?.unit?.display) {
    return `${quantity.quantity.value} ${quantity.quantity.unit.display}`;
  }
  return "N/A";
}

// --- Status Maps (from CollectedSpecimenCard) ---
const statusVariantMap: Record<
  string,
  "default" | "destructive" | "outline" | "secondary"
> = {
  available: "default",
  unavailable: "destructive",
  unsatisfactory: "destructive",
  entered_in_error: "destructive",
  received: "secondary",
};

const statusColorMap: Record<string, string> = {
  available: "bg-green-100 text-green-800 border-green-200",
  unavailable: "bg-red-100 text-red-800 border-red-200",
  unsatisfactory: "bg-yellow-100 text-yellow-800 border-yellow-200",
  received: "bg-blue-100 text-blue-800 border-blue-200",
};

// --- Main Combined Component ---
interface SpecimenWorkflowCardProps {
  facilityId: string;
  serviceRequestId: string;
  requirement: SpecimenDefinitionRead;
  collectedSpecimen?: SpecimenRead; // Collected specimen is optional
  onCollect: () => void; // Function to trigger collection form
}

export function SpecimenWorkflowCard({
  facilityId,
  serviceRequestId,
  requirement,
  collectedSpecimen,
  onCollect,
}: SpecimenWorkflowCardProps) {
  const queryClient = useQueryClient();
  const authUser = useAuthUser();
  const currentUserId = authUser.external_id;

  const container = requirement.type_tested?.container;
  const hasCollected = !!collectedSpecimen;

  // --- Mutations (specific to the collected specimen) ---
  const { mutate: updateProcessing } = useMutation({
    mutationFn: (processingSteps: ProcessingSpec[]) => {
      if (!collectedSpecimen) return Promise.reject("No specimen to update");

      // Use the imported SpecimenUpdatePayload type
      const payload: SpecimenRead = {
        ...collectedSpecimen,
        processing: processingSteps,
      };

      return mutate(specimenApi.updateSpecimen, {
        pathParams: { facilityId, specimenId: collectedSpecimen.id },
      })(payload);
    },
    onSuccess: () => {
      toast.success(`Processing updated for ${collectedSpecimen?.id}`);
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", serviceRequestId],
      });
    },
    onError: (err: any) => {
      toast.error(
        `Failed to update processing: ${err.message || "Unknown error"}`,
      );
    },
  });

  // const { mutate: discardSpecimen, isPending: isDiscarding } = useMutation({
  //   mutationFn: () => {
  //     if (!collectedSpecimen) return Promise.reject("No specimen to discard");
  //     return mutate(specimenApi.updateSpecimen, {
  //       pathParams: { facilityId, specimenId: collectedSpecimen.id },
  //     })(collectedSpecimen);
  //   },
  //   onSuccess: () => {
  //     toast.success(`Specimen ${collectedSpecimen?.id} marked as discarded.`);
  //     queryClient.invalidateQueries({
  //       queryKey: ["serviceRequest", serviceRequestId],
  //     });
  //   },
  //   onError: (err: any) => {
  //     toast.error(
  //       `Failed to discard specimen: ${err.message || "Unknown error"}`,
  //     );
  //   },
  // });

  // --- Handlers (acting on the collected specimen) ---
  const handleAddProcessing = (newStep: ProcessingSpec) => {
    if (!currentUserId || !collectedSpecimen) return; // Need user and specimen
    const stepWithPerformer: ProcessingSpec = {
      ...newStep,
      performer: currentUserId,
      time_date_time: new Date().toISOString(),
    };
    const updatedProcessing = [
      ...(collectedSpecimen.processing ?? []),
      stepWithPerformer,
    ];
    updateProcessing(updatedProcessing);
  };

  const handleUpdateProcessing = (
    index: number,
    updatedStepData: ProcessingSpec,
  ) => {
    if (!currentUserId || !collectedSpecimen) return;
    const updatedProcessing = [...(collectedSpecimen.processing ?? [])];
    if (updatedProcessing[index]) {
      updatedProcessing[index] = {
        ...updatedProcessing[index],
        ...updatedStepData,
        performer: currentUserId,
        time_date_time:
          updatedStepData.time_date_time ??
          updatedProcessing[index].time_date_time,
      };
      updateProcessing(updatedProcessing);
    } else {
      toast.error("Attempted to update non-existent processing step");
    }
  };

  const isDiscarded =
    collectedSpecimen?.status === SpecimenStatus.unavailable ||
    collectedSpecimen?.status === SpecimenStatus.entered_in_error;

  // Define badge styles
  const instructionsBadgeVariant = hasCollected ? "default" : "outline";
  const instructionsBadgeColor = hasCollected
    ? "bg-green-100 text-green-800 border-green-200"
    : "";
  const collectionBadgeVariant = "default"; // Always default variant for success
  const collectionBadgeColor = "bg-green-100 text-green-800 border-green-200";
  const [isOpen, setIsOpen] = useState(!hasCollected);

  return (
    <Card
      className={cn(
        "overflow-hidden rounded-lg",
        isDiscarded && "opacity-70 bg-gray-50",
      )}
    >
      <Collapsible open={isOpen}>
        <CollapsibleTrigger
          asChild
          className={cn(hasCollected && "cursor-pointer")}
        >
          {/* === Header: Changes based on collection status === */}
          <CardHeader
            className="p-4 border-b bg-white"
            onClick={() => hasCollected && setIsOpen(!isOpen)}
          >
            {hasCollected && collectedSpecimen ? (
              // --- Collected Header ---
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <CardTitle className="text-lg font-semibold">
                    {/* Use a more prominent ID like accession or fallback */}
                    {collectedSpecimen.accession_identifier ||
                      collectedSpecimen.specimen_definition.title}
                  </CardTitle>
                  {/* Mimic original UI structure */}
                  <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm text-muted-foreground mt-4">
                    {collectedSpecimen.accession_identifier && (
                      <span className="flex  gap-1.5 flex-col">
                        <span className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Barcode className="h-4 w-4" />
                          {collectedSpecimen.accession_identifier}
                        </span>
                      </span>
                    )}
                    {collectedSpecimen.specimen_definition?.type_tested
                      ?.container?.cap?.display && (
                      <span className="flex  gap-1.5 flex-col">
                        <span className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Droplet className="h-4 w-4" />
                          Container Cap:{" "}
                        </span>
                        {
                          collectedSpecimen.specimen_definition.type_tested
                            .container.cap.display
                        }
                      </span>
                    )}
                    {collectedSpecimen.specimen_type?.display && (
                      <span className="flex  gap-1.5 flex-col">
                        <span className="text-xs text-gray-500 flex items-center gap-1.5">
                          <TestTubeDiagonal className="h-4 w-4" />
                          Specimen:{" "}
                        </span>
                        {collectedSpecimen.specimen_type.display}
                      </span>
                    )}
                    {collectedSpecimen.collection?.collector && (
                      <span className="flex  gap-1.5 flex-col">
                        <span className="text-xs text-gray-500 flex items-center gap-1.5">
                          <User className="h-4 w-4" />
                          Collector:{" "}
                        </span>
                        {collectedSpecimen.collection.collector}
                      </span>
                    )}
                  </div>
                </div>
                {/* Status Badge on Right */}
                <div className="flex items-center gap-4">
                  <Badge
                    variant={
                      statusVariantMap[collectedSpecimen.status] || "secondary"
                    }
                    className={cn(
                      "capitalize font-medium h-fit",
                      statusColorMap[collectedSpecimen.status],
                    )}
                  >
                    {collectedSpecimen.status?.replace(/_/g, " ") ||
                      "Unknown Status"}
                  </Badge>
                  {isOpen ? (
                    <ChevronsDownUp className="size-7 border border-gray-300 rounded-md p-1 shadow-sm transition-transform duration-200" />
                  ) : (
                    <ChevronsUpDown className="size-7 border border-gray-300 rounded-md p-1 shadow-sm transition-transform duration-200" />
                  )}
                </div>
              </div>
            ) : (
              // --- Pending Collection Header ---
              <div className="flex flex-row items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <PackageSearch className="h-5 w-5 text-gray-600" />
                  Required: {requirement.title}
                </CardTitle>
                <Badge
                  variant="outline"
                  className="bg-orange-100 text-orange-900"
                >
                  <CircleDashed className="h-4 w-4 mr-1.5" />
                  Collection Pending
                </Badge>
                <Button onClick={onCollect} variant="outline_primary">
                  <Plus className="h-4 w-4" />
                  Collect Specimen
                </Button>
              </div>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden">
          {/* === Accordion for Instructions, Collection Details, Processing, Discard === */}
          <CardContent className="p-0">
            <Accordion type="multiple" className="w-full" defaultValue={[]}>
              {/* 1. Instructions */}
              <AccordionItem value="instructions">
                <AccordionTrigger className="px-4 py-3 text-sm hover:bg-gray-50/50">
                  <div className="flex items-center gap-2 flex-1 mr-4">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">
                      Specimen Collection Instructions
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={instructionsBadgeVariant}
                      className={cn(instructionsBadgeColor)}
                    >
                      {hasCollected ? "Instructions Viewed" : "Pending View"}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-1 pb-4 space-y-4 bg-gray-50/30 border-t bg-gray-100">
                  <div className="space-y-1">
                    <p className="font-medium text-xs text-gray-950 uppercase tracking-wide">
                      Specimen & Collection
                    </p>
                    <Card className="p-2">
                      <Table className="rounded-md">
                        <TableHeader className="text-xs text-gray-700 bg-gray-100 uppercase tracking-wide">
                          <TableRow>
                            <TableHead className="w-[150px] text-gray-700 ">
                              Field
                            </TableHead>
                            <TableHead className="text-gray-700">
                              Details
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableHead className="w-[150px] text-gray-700">
                              Required Type
                            </TableHead>
                            <TableCell className="text-gray-950 font-semibold">
                              {requirement.type_collected?.display ?? "N/A"}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableHead className="text-gray-700">
                              Required Method
                            </TableHead>
                            <TableCell className="text-gray-950 font-semibold">
                              {requirement.collection?.display ?? "N/A"}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableHead className="text-gray-700">
                              Patient Prep
                            </TableHead>
                            <TableCell className="text-gray-950 font-semibold">
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
                    </Card>
                  </div>
                  {container && (
                    <div className="space-y-1">
                      <p className="font-medium text-xs text-gray-950 uppercase tracking-wide">
                        Required Container
                      </p>
                      <Card className="p-2">
                        <Table>
                          <TableHeader className="text-xs text-gray-700 bg-gray-100 uppercase tracking-wide">
                            <TableRow>
                              <TableHead className="w-[150px] text-gray-700 ">
                                Field
                              </TableHead>
                              <TableHead className="text-gray-700">
                                Details
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableHead className="w-[150px] text-gray-700">
                                Container
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {container.cap?.display ?? "N/A"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableHead className="text-gray-700">
                                Capacity
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {container.capacity
                                  ? formatQuantity({
                                      quantity: container.capacity,
                                    })
                                  : "N/A"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableHead className="text-gray-700">
                                Min. Volume
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {container.minimum_volume
                                  ? formatQuantity(container.minimum_volume)
                                  : "N/A"}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableHead className="text-gray-700">
                                Preparation
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {container.preparation ?? "N/A"}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </Card>
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="font-medium text-xs text-gray-950 uppercase tracking-wide">
                      Required Processing & Storage
                    </p>
                    <Card className="p-2">
                      <Table>
                        <TableHeader className="text-xs text-gray-700 bg-gray-100 uppercase tracking-wide">
                          <TableRow>
                            <TableHead className="w-[150px] text-gray-700">
                              Field
                            </TableHead>
                            <TableHead className="text-gray-700">
                              Details
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableHead className="w-[150px] text-gray-700">
                              {t("retention")}
                            </TableHead>
                            <TableCell className="text-gray-950 font-semibold">
                              {requirement.type_tested?.retention_time
                                ? `${requirement.type_tested.retention_time.value} ${requirement.type_tested.retention_time.unit.display}`
                                : "N/A"}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 2. Collection Details (Only if collected) */}
              {hasCollected && collectedSpecimen && (
                <AccordionItem value="collection-details">
                  <AccordionTrigger className="px-4 py-3 text-sm hover:bg-gray-50/50">
                    <div className="flex items-center gap-2 flex-1 mr-4">
                      <Receipt className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Specimen Collection</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={collectionBadgeVariant}
                        className={cn(collectionBadgeColor)}
                      >
                        1/1 Collected
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-1 pb-4 space-y-4 bg-gray-50/30 border-t">
                    <h3 className="font-medium text-base mb-2 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-gray-600" />
                      Collected Specimen Details
                    </h3>
                    <Card className="p-2">
                      <Table>
                        <TableHeader className="text-xs text-gray-700 bg-gray-100 uppercase tracking-wide">
                          <TableRow>
                            <TableHead className="w-[150px] text-gray-700 ">
                              Field
                            </TableHead>
                            <TableHead className="text-gray-700">
                              Details
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {collectedSpecimen.collection?.collector && (
                            <TableRow>
                              <TableHead className="w-[150px] text-gray-700">
                                Collector
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {collectedSpecimen.collection.collector}
                              </TableCell>
                            </TableRow>
                          )}
                          {collectedSpecimen.collection
                            ?.collected_date_time && (
                            <TableRow>
                              <TableHead className="text-gray-700">
                                Collected Time
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {new Date(
                                  collectedSpecimen.collection.collected_date_time,
                                ).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          )}
                          {collectedSpecimen.collection?.body_site && (
                            <TableRow>
                              <TableHead className="text-gray-700">
                                Body Site
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {collectedSpecimen.collection.body_site.display}
                              </TableCell>
                            </TableRow>
                          )}
                          {collectedSpecimen.collection?.quantity && (
                            <TableRow>
                              <TableHead className="text-gray-700">
                                Quantity
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {formatQuantity({
                                  quantity:
                                    collectedSpecimen.collection.quantity,
                                })}
                              </TableCell>
                            </TableRow>
                          )}
                          {collectedSpecimen.collection
                            ?.fasting_status_codeable_concept && (
                            <TableRow>
                              <TableHead className="text-gray-700">
                                Fasting Status
                              </TableHead>
                              <TableCell className="text-gray-950 font-semibold">
                                {
                                  collectedSpecimen.collection
                                    .fasting_status_codeable_concept.display
                                }{" "}
                                {collectedSpecimen.collection
                                  .fasting_status_duration &&
                                  `(${formatQuantity({ quantity: collectedSpecimen.collection.fasting_status_duration })})`}
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* 3. Processing (Only if collected and not discarded) */}
              {hasCollected && !isDiscarded && (
                <div className="px-4 pt-3 pb-4 border-t">
                  <ProcessSpecimen
                    existingProcessing={collectedSpecimen?.processing ?? []}
                    onAddProcessing={handleAddProcessing}
                    onUpdateProcessing={handleUpdateProcessing}
                  />
                </div>
              )}

              {/* TODO: Move to Action button */}
              {/* 4. Discard (Only if collected)
          {hasCollected && (
            <AccordionItem value="discard">
              <AccordionTrigger className="px-4 py-3 text-sm hover:bg-gray-50/50 data-[state=open]:text-red-600">
                <div
                  className={cn(
                    "flex items-center gap-2 flex-1 mr-4",
                    isDiscarded && "text-red-700",
                  )}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="font-medium">Discard Specimen</span>
                </div>
                <div className="flex items-center gap-2">
                  {isDiscarded && (
                    <Badge variant="destructive">Discarded</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pt-3 pb-4 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Mark this specimen as unavailable/discarded.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isDiscarding || isDiscarded}
                      >
                        {isDiscarded ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />{" "}
                            Discarded
                          </>
                        ) : (
                          "Discard Specimen"
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will mark the specimen as
                          discarded/unavailable and cannot be easily undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDiscarding}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => discardSpecimen()}
                          disabled={isDiscarding}
                        >
                          {isDiscarding ? "Discarding..." : "Confirm Discard"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </AccordionContent>
            </AccordionItem>
          )} */}
            </Accordion>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
