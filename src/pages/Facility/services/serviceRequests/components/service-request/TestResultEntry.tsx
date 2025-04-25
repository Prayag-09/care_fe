import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Edit, MessageSquare, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
// Import Code type

// Import Tooltip
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import mutate from "@/Utils/request/mutate";
// For unit selection

import {
  ObservationCreate,
  ObservationRead,
} from "@/types/emr/observation/observation";
import observationApi from "@/types/emr/observation/observationApi";
import { ObservationDefinitionReadSpec } from "@/types/emr/observationDefinition/observationDefinition";
import { Code } from "@/types/questionnaire/code";

interface TestResultEntryProps {
  facilityId: string;
  serviceRequestId: string;
  patientId: string;
  definition: ObservationDefinitionReadSpec;
  existingObservation: ObservationRead | undefined;
  specimenId?: string; // Optional: Pass if result needs linking to a specific specimen
}

function checkNormal(
  value: number | undefined,
  range: any,
): "normal" | "abnormal" | "indeterminate" {
  if (
    value === undefined ||
    value === null ||
    !range ||
    (!range.low && !range.high)
  ) {
    return "indeterminate";
  }
  const low = range.low?.value;
  const high = range.high?.value;

  if (low !== undefined && high !== undefined) {
    return value >= low && value <= high ? "normal" : "abnormal";
  }
  if (low !== undefined) {
    return value >= low ? "normal" : "abnormal";
  }
  if (high !== undefined) {
    return value <= high ? "normal" : "abnormal";
  }
  return "indeterminate";
}

export function TestResultEntry({
  facilityId,
  serviceRequestId,
  patientId,
  definition,
  existingObservation,
  specimenId,
}: TestResultEntryProps) {
  const queryClient = useQueryClient();
  const [resultValue, setResultValue] = useState<string>(
    existingObservation?.value_quantity?.value?.toString() ?? "",
  );
  const [selectedUnit, setSelectedUnit] = useState<string>(
    existingObservation?.value_quantity?.unit ??
      definition.permitted_unit?.display ??
      "",
  );
  const [isEditing, setIsEditing] = useState<boolean>(!existingObservation);
  const [note, setNote] = useState<string>(existingObservation?.note ?? "");
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState<boolean>(false);

  const primaryRange = existingObservation?.reference_range?.[0] ?? undefined; // Use existing observation's range first
  const normalStatus = checkNormal(parseFloat(resultValue), primaryRange);

  const { mutate: saveObservation, isPending: isLoading } = useMutation({
    mutationFn: (data: ObservationCreate | Partial<ObservationCreate>) => {
      if (existingObservation?.id) {
        return mutate(observationApi.updateObservation, {
          pathParams: { facilityId, observationId: existingObservation.id },
        })(data as Partial<ObservationCreate>);
      }
      return mutate(observationApi.createObservation, {
        pathParams: { facilityId },
      })(data as ObservationCreate);
    },
    onSuccess: () => {
      toast.success(`Result for ${definition.title} saved.`);
      setIsEditing(false);
      queryClient.invalidateQueries({
        queryKey: ["serviceRequest", serviceRequestId],
      });
    },
    onError: (err: any) => {
      toast.error(`Failed to save result: ${err.message || "Unknown error"}`);
    },
  });

  const handleSave = () => {
    const value = parseFloat(resultValue);
    if (isNaN(value)) {
      toast.error("Invalid result value");
      return;
    }

    const observationData: Partial<ObservationCreate> & {
      status: string;
      code: Code;
      subject: any;
    } = {
      status: "final", // Default status, adjust as needed
      code: definition.code,
      subject: { id: patientId, resource_type: "Patient" },
      value_quantity: {
        value: value,
        unit: selectedUnit,
        // Add system/code for unit if available/needed
      },
      observation_definition_id: definition.id,
      service_request_id: serviceRequestId,
      specimen_id: specimenId, // Include specimen link if available
      note: note, // Pass the note state directly (string)
      // Include interpretation, reference_range if needed
    };

    saveObservation(observationData);
  };

  const handleCancel = () => {
    setResultValue(
      existingObservation?.value_quantity?.value?.toString() ?? "",
    );
    setSelectedUnit(
      existingObservation?.value_quantity?.unit ??
        definition.permitted_unit?.display ??
        "",
    );
    setNote(existingObservation?.note ?? "");
    setIsEditing(false);
  };

  const units: string[] = definition.permitted_unit?.display
    ? [definition.permitted_unit.display]
    : [];

  const badgeVariant = normalStatus === "normal" ? "default" : "destructive";
  const badgeColor =
    normalStatus === "normal" ? "bg-green-100 text-green-800" : ""; // Add abnormal color if needed

  return (
    <div className="p-4 border rounded-lg bg-white space-y-3 relative group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-800">
            {definition.title}
          </p>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            {primaryRange && (
              <span>
                Ref:{" "}
                {primaryRange.text ??
                  `${primaryRange.low?.value ?? ""}-${primaryRange.high?.value ?? ""} ${primaryRange.low?.unit ?? primaryRange.high?.unit ?? ""}`}
              </span>
            )}
            {units.length === 1 && <span>Unit: {units[0]}</span>}
          </div>
        </div>
        {!isEditing && normalStatus !== "indeterminate" && (
          <Badge
            variant={badgeVariant}
            className={cn(badgeColor, "capitalize")}
          >
            {normalStatus}
          </Badge>
        )}
      </div>

      <div className="flex items-end gap-2">
        <div className="flex-1">
          {isEditing && units.length > 1 && (
            <Label className="text-xs mb-1 block">Unit</Label>
          )}
          <div className="flex gap-2">
            <div className="flex-1">
              {isEditing && (
                <Label className="text-xs mb-1 block">Result</Label>
              )}
              <Input
                type="number" // Use number input
                value={resultValue}
                onChange={(e) => setResultValue(e.target.value)}
                placeholder="Enter result"
                disabled={!isEditing || isLoading}
                className={cn(
                  !isEditing &&
                    "border-none px-0 h-auto !ring-offset-0 !ring-0 !shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
                  isEditing && "h-9",
                )}
              />
            </div>
            {units.length > 1 ? (
              <div className="w-[100px]">
                <Select
                  value={selectedUnit}
                  onValueChange={setSelectedUnit}
                  disabled={!isEditing || isLoading || units.length <= 1}
                >
                  <SelectTrigger
                    className={cn(
                      !isEditing &&
                        "border-none px-0 h-auto !ring-offset-0 !ring-0 !shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
                      isEditing && "h-9",
                    )}
                  >
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              !isEditing &&
              units.length === 1 && (
                <span className="text-sm text-muted-foreground self-center">
                  {selectedUnit}
                </span>
              )
            )}
          </div>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-1 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {note && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <MessageSquare className="h-4 w-4 text-blue-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs break-words">{note}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setIsNoteDialogOpen(true)}
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{note ? "Edit Note" : "Add Note"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsNoteDialogOpen(true)}
            disabled={isLoading}
          >
            {note ? (
              <Edit className="h-4 w-4 mr-1" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Note
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              "Saving..."
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" /> Save
              </>
            )}
          </Button>
        </div>
      )}

      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add/Edit Note for {definition.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="note-input">Note</Label>
            <Textarea
              id="note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any relevant notes for this result..."
              className="min-h-[100px] mt-1"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNoteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsNoteDialogOpen(false);
                // Optionally save immediately when note dialog closes if editing?
                if (isEditing) {
                  // handleSave(); // Consider UX implications
                }
              }}
            >
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
