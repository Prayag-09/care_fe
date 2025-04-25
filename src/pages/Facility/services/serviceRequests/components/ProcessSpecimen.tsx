import { Check, Edit, Settings2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { ProcessingSpec } from "@/types/emr/specimen/specimen";
import { Code } from "@/types/questionnaire/code";

interface ProcessSpecimenProps {
  onAddProcessing: (processing: ProcessingSpec) => void;
  onUpdateProcessing: (index: number, processing: ProcessingSpec) => void;
  existingProcessing?: ProcessingSpec[];
}

export function ProcessSpecimen({
  onAddProcessing,
  onUpdateProcessing,
  existingProcessing = [],
}: ProcessSpecimenProps) {
  const [noteDialog, setNoteDialog] = useState<{
    open: boolean;
    index: number;
    description: string;
    method: Code | null;
  }>({
    open: false,
    index: -1,
    description: "",
    method: null,
  });

  const handleSelectStep = (code: Code | null) => {
    if (!code) return;

    // Open the description dialog immediately when a step is selected
    setNoteDialog({
      open: true,
      index: -1,
      description: code.display,
      method: code,
    });
  };

  const handleOpenNote = (
    e: React.MouseEvent,
    index: number,
    description: string,
    method: Code | null,
  ) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    setNoteDialog({
      open: true,
      index,
      description,
      method,
    });
  };

  const handleUpdateNote = () => {
    if (noteDialog.index === -1) {
      // This is a new processing step
      onAddProcessing({
        description: noteDialog.description,
        method: noteDialog.method,
        performer: null,
        time_date_time: new Date().toISOString(),
      });
    } else {
      // This is updating an existing step
      const process = existingProcessing[noteDialog.index];
      onUpdateProcessing(noteDialog.index, {
        ...process,
        description: noteDialog.description,
      });
    }
    setNoteDialog({ open: false, index: -1, description: "", method: null });
  };

  return (
    <>
      <div>
        <div className="flex-row items-center justify-between space-y-0 pb-2">
          <div className="text-base font-medium flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Process Specimen
          </div>
        </div>
        <div className="space-y-4">
          {existingProcessing.map((process, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2"
            >
              <Check className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {process.method?.display || process.description}
                </div>
                {process.method &&
                  process.description !== process.method.display && (
                    <div className="text-sm text-gray-600 mt-0.5">
                      {process.description}
                    </div>
                  )}
              </div>
              <Button
                type="button" // Explicitly set type to button
                variant="ghost"
                size="sm"
                className="ml-auto h-auto p-1.5"
                onClick={(e) =>
                  handleOpenNote(e, index, process.description, process.method)
                }
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          ))}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Choose Processing Steps Performed on the Specimen
            </label>
            <ValueSetSelect
              system="system-specimen-processing-method-code"
              placeholder="Select processing step..."
              onSelect={handleSelectStep}
              value={null}
            />
          </div>
        </div>
      </div>

      <Dialog
        open={noteDialog.open}
        onOpenChange={(open) =>
          !open && setNoteDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {noteDialog.index === -1
                ? "Add Processing Step"
                : "Edit Processing Step"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {noteDialog.method && (
              <div className="rounded-md bg-gray-50 p-3">
                <Label className="text-sm text-gray-600">
                  Processing Method
                </Label>
                <div className="font-medium mt-1">
                  {noteDialog.method.display}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={noteDialog.description}
                onChange={(e) =>
                  setNoteDialog((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Describe the processing step in detail..."
                className="min-h-[100px]"
              />
              <p className="text-sm text-muted-foreground">
                Add specific details about how this processing step was
                performed.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setNoteDialog({
                  open: false,
                  index: -1,
                  description: "",
                  method: null,
                })
              }
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleUpdateNote}>
              {noteDialog.index === -1 ? "Add Step" : "Update Step"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
