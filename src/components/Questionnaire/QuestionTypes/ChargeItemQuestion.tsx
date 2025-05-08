import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronsUpDown, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { FieldError } from "@/components/Questionnaire/QuestionTypes/FieldError";

import query from "@/Utils/request/query";
import {
  ChargeItemBase,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import { QuestionValidationError } from "@/types/questionnaire/batch";
import { QuestionnaireResponse } from "@/types/questionnaire/form";
import { ResponseValue } from "@/types/questionnaire/form";

interface ChargeItemQuestionProps {
  encounterId: string;
  facilityId: string;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  errors?: QuestionValidationError[];
}

const CHARGE_ITEM_FIELDS = {
  STATUS: {
    key: "status",
    required: true,
  },
  QUANTITY: {
    key: "quantity",
    required: true,
  },
} as const;

export function validateChargeItemQuestion(
  values: any[],
  questionId: string,
): QuestionValidationError[] {
  return values.reduce((errors: QuestionValidationError[], value, index) => {
    const fieldErrors = Object.entries(CHARGE_ITEM_FIELDS)
      .filter(([_, field]) => field.required && !value[field.key])
      .map(([_, field]) => ({
        question_id: questionId,
        error: "field_required",
        type: "validation_error",
        field_key: field.key,
        index,
      }));

    return [...errors, ...fieldErrors];
  }, []);
}

interface ChargeItemFormProps {
  chargeItem: ChargeItemBase;
  onUpdate?: (updates: ChargeItemBase) => void;
  onRemove?: () => void;
  onAdd?: () => void;
  disabled?: boolean;
  errors?: QuestionValidationError[];
  questionId?: string;
  index?: number;
  isPreview?: boolean;
}

function ChargeItemForm({
  chargeItem,
  onUpdate,
  onRemove,
  onAdd,
  disabled,
  errors,
  questionId,
  index,
  isPreview = false,
}: ChargeItemFormProps) {
  const { t } = useTranslation();

  if (isPreview) {
    return (
      <div className="rounded-md border border-primary-500 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold">{chargeItem.title}</p>
            <span className="text-sm text-gray-500">
              {chargeItem.unit_price_components?.[0]?.amount || 0}{" "}
              {chargeItem.unit_price_components?.[0]?.code?.code || "INR"}
            </span>
          </div>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <div className="space-y-2">
            <Label>
              {t("status")} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={chargeItem.status}
              onValueChange={(value: ChargeItemStatus) =>
                onUpdate?.({ ...chargeItem, status: value })
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select_status")} />
              </SelectTrigger>
              <SelectContent>
                {Object.values([
                  ChargeItemStatus.billable,
                  ChargeItemStatus.planned,
                ]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {questionId && index !== undefined && (
              <FieldError
                fieldKey={CHARGE_ITEM_FIELDS.STATUS.key}
                questionId={questionId}
                errors={errors}
                index={index}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>
              {t("quantity")} <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              value={chargeItem.quantity}
              onChange={(e) =>
                onUpdate?.({
                  ...chargeItem,
                  quantity: parseInt(e.target.value, 10),
                })
              }
              disabled={disabled}
            />
            {questionId && index !== undefined && (
              <FieldError
                fieldKey={CHARGE_ITEM_FIELDS.QUANTITY.key}
                questionId={questionId}
                errors={errors}
                index={index}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("note")}</Label>
            <Textarea
              value={chargeItem.note || ""}
              onChange={(e) =>
                onUpdate?.({ ...chargeItem, note: e.target.value })
              }
              disabled={disabled}
              placeholder={t("add_notes")}
            />
          </div>
        </div>
        {isPreview && (
          <div className="flex justify-end">
            <Button onClick={onAdd} data-cy="add-charge-item">
              {t("add")}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Collapsible defaultOpen={false}>
      <div className="rounded-md border border-gray-200">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-2 hover:bg-gray-50 cursor-pointer">
          <div className="flex flex-col gap-1 items-start">
            <p className="text-sm font-semibold">{chargeItem.title}</p>
            <span className="text-sm text-gray-500">
              {chargeItem.unit_price_components?.[0]?.amount || 0}{" "}
              {chargeItem.unit_price_components?.[0]?.code?.code || "INR"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove();
                }}
                disabled={disabled}
                data-cy="remove-charge-item"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 space-y-4">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  {t("status")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={chargeItem.status}
                  onValueChange={(value: ChargeItemStatus) =>
                    onUpdate?.({ ...chargeItem, status: value })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_status")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values([
                      ChargeItemStatus.billable,
                      ChargeItemStatus.planned,
                    ]).map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {questionId && index !== undefined && (
                  <FieldError
                    fieldKey={CHARGE_ITEM_FIELDS.STATUS.key}
                    questionId={questionId}
                    errors={errors}
                    index={index}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  {t("quantity")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={chargeItem.quantity}
                  onChange={(e) =>
                    onUpdate?.({
                      ...chargeItem,
                      quantity: parseInt(e.target.value, 10),
                    })
                  }
                  disabled={disabled}
                />
                {questionId && index !== undefined && (
                  <FieldError
                    fieldKey={CHARGE_ITEM_FIELDS.QUANTITY.key}
                    questionId={questionId}
                    errors={errors}
                    index={index}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("note")}</Label>
                <Textarea
                  value={chargeItem.note || ""}
                  onChange={(e) =>
                    onUpdate?.({ ...chargeItem, note: e.target.value })
                  }
                  disabled={disabled}
                  placeholder={t("add_notes")}
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function ChargeItemQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  facilityId,
  encounterId,
  errors,
}: ChargeItemQuestionProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedChargeItemDefinition, setSelectedChargeItemDefinition] =
    useState<string | null>(null);
  const [previewChargeItem, setPreviewChargeItem] = useState<any | null>(null);
  const [chargeItems, setChargeItems] = useState<any[]>(
    (questionnaireResponse.values?.[0]?.value as any[]) || [],
  );

  const { data: chargeItemDefinitions } = useQuery({
    queryKey: ["charge_item_definitions"],
    queryFn: query(chargeItemDefinitionApi.listChargeItemDefinition, {
      pathParams: { facilityId },
      queryParams: { limit: 100 },
    }),
  });

  const {
    data: selectedChargeItemDefinitionData,
    isLoading: isLoadingSelectedCID,
  } = useQuery({
    queryKey: ["charge_item_definition", selectedChargeItemDefinition],
    queryFn: query(chargeItemDefinitionApi.retrieveChargeItemDefinition, {
      pathParams: {
        facilityId,
        chargeItemDefinitionId: selectedChargeItemDefinition || "",
      },
    }),
    enabled: !!selectedChargeItemDefinition,
  });

  useEffect(() => {
    if (selectedChargeItemDefinition && selectedChargeItemDefinitionData) {
      const selectedCID = chargeItemDefinitions?.results.find(
        (cid) => cid.id === selectedChargeItemDefinition,
      );
      if (!selectedCID) return;

      const newChargeItem = {
        title: selectedCID.title,
        status: ChargeItemStatus.billable,
        quantity: 1,
        unit_price_components: selectedCID.price_component,
        note: null,
        override_reason: null,
        encounter: encounterId,
      };

      setPreviewChargeItem(newChargeItem);
      setOpen(false);
    }
  }, [
    selectedChargeItemDefinition,
    selectedChargeItemDefinitionData,
    chargeItemDefinitions,
    encounterId,
  ]);

  const handleAddChargeItem = () => {
    if (!previewChargeItem) return;

    setChargeItems([...chargeItems, previewChargeItem]);
    updateQuestionnaireResponseCB(
      [{ type: "charge_item", value: [...chargeItems, previewChargeItem] }],
      questionnaireResponse.question_id,
    );
    setPreviewChargeItem(null);
    setSelectedChargeItemDefinition(null);
  };

  const handleRemoveChargeItem = (index: number) => {
    const newChargeItems = chargeItems.filter((_, i: number) => i !== index);
    setChargeItems(newChargeItems);
    updateQuestionnaireResponseCB(
      [{ type: "charge_item", value: newChargeItems }],
      questionnaireResponse.question_id,
    );
  };

  const handleUpdateChargeItem = (index: number, updates: any) => {
    const newChargeItems = chargeItems.map((ci: any, i: number) => {
      if (i !== index) return ci;
      return { ...ci, ...updates };
    });

    setChargeItems(newChargeItems);
    updateQuestionnaireResponseCB(
      [{ type: "charge_item", value: newChargeItems }],
      questionnaireResponse.question_id,
    );
  };

  const handlePreviewChargeItemUpdate = (updates: any) => {
    if (!previewChargeItem) return;
    setPreviewChargeItem({ ...previewChargeItem, ...updates });
  };

  const chargeItemDefinitionOptions = useMemo(
    () =>
      chargeItemDefinitions?.results
        .filter((cid) => cid.status === "active")
        .map((cid) => ({
          id: cid.id,
          title: cid.title,
        })) || [],
    [chargeItemDefinitions?.results],
  );

  useEffect(() => {
    const initialChargeItems =
      (questionnaireResponse.values?.[0]?.value as any[]) || [];

    if (JSON.stringify(initialChargeItems) !== JSON.stringify(chargeItems)) {
      setChargeItems(initialChargeItems);
    }
  }, [questionnaireResponse.values]);

  return (
    <div className="space-y-4">
      {chargeItems.map((chargeItem, index) => (
        <ChargeItemForm
          key={`${chargeItem.title}-${index}`}
          chargeItem={chargeItem}
          onUpdate={(updates) => handleUpdateChargeItem(index, updates)}
          onRemove={() => handleRemoveChargeItem(index)}
          disabled={disabled}
          errors={errors}
          questionId={questionnaireResponse.question_id}
          index={index}
        />
      ))}

      {isLoadingSelectedCID && (
        <div className="rounded-md border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {previewChargeItem && !isLoadingSelectedCID && (
        <ChargeItemForm
          chargeItem={previewChargeItem}
          onUpdate={handlePreviewChargeItemUpdate}
          onRemove={() => {
            setPreviewChargeItem(null);
            setSelectedChargeItemDefinition(null);
          }}
          onAdd={handleAddChargeItem}
          disabled={disabled}
          isPreview
        />
      )}

      <div className="space-y-2 w-full">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={disabled}
            >
              {selectedChargeItemDefinition
                ? chargeItemDefinitionOptions.find(
                    (cid) => cid.id === selectedChargeItemDefinition,
                  )?.title
                : t("select_charge_item_definition")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput
                placeholder={t("search_charge_item_definitions")}
                className="h-9"
              />
              <CommandEmpty>
                {t("no_charge_item_definitions_found")}
              </CommandEmpty>
              <CommandGroup>
                {chargeItemDefinitionOptions.map((cid) => (
                  <CommandItem
                    key={cid.id}
                    value={cid.id}
                    onSelect={() => {
                      setSelectedChargeItemDefinition(cid.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedChargeItemDefinition === cid.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {cid.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
