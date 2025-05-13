import { useQuery } from "@tanstack/react-query";
import { InfoIcon, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
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

import ChargeItemPriceDisplay from "@/components/Billing/ChargeItem/ChargeItemPriceDisplay";
import { FieldError } from "@/components/Questionnaire/QuestionTypes/FieldError";

import query from "@/Utils/request/query";
import {
  ChargeItemStatus,
  ChargeItemUpsert,
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

interface ChargeItemFormProps {
  chargeItem: ChargeItemUpsert;
  onUpdate?: (updates: ChargeItemUpsert) => void;
  onRemove?: () => void;
  onAdd?: () => void;
  disabled?: boolean;
  errors?: QuestionValidationError[];
  questionId?: string;
  index?: number;
  isPreview?: boolean;
  defaultOpen?: boolean;
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
  const [isPriceOpen, setIsPriceOpen] = useState(false);

  return (
    <div className="rounded-md border border-primary-500 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">{chargeItem.title}</p>
          <div className="flex items-center gap-2">
            <div className="text-sm mt-1 text-gray-600 capitalize flex items-center gap-1 justify-center">
              <span className="text-sm text-gray-600">
                {chargeItem.unit_price_components?.[0]?.amount || 0}{" "}
                {chargeItem.unit_price_components?.[0]?.code?.code || "INR"}
              </span>
              {chargeItem.unit_price_components?.length > 0 && (
                <>
                  <Popover open={isPriceOpen} onOpenChange={setIsPriceOpen}>
                    <PopoverTrigger asChild>
                      <div className="flex items-center cursor-pointer">
                        <InfoIcon className="h-4 w-4 text-gray-700" />
                      </div>
                    </PopoverTrigger>
                    <PopoverContent side="right" className="p-0">
                      <ChargeItemPriceDisplay
                        priceComponents={chargeItem.unit_price_components}
                      />
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>
          </div>
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

        <div className="space-y-2 col-span-2">
          <Label>{t("note")}</Label>
          <textarea
            className="field-sizing-content focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-md w-full"
            rows={3}
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

export function ChargeItemQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  facilityId,
  encounterId,
  errors,
}: ChargeItemQuestionProps) {
  const { t } = useTranslation();
  const [selectedChargeItemDefinition, setSelectedChargeItemDefinition] =
    useState<string | null>(null);
  const [previewChargeItem, setPreviewChargeItem] =
    useState<ChargeItemUpsert | null>(null);
  const [chargeItems, setChargeItems] = useState<ChargeItemUpsert[]>(
    (questionnaireResponse.values?.[0]?.value as ChargeItemUpsert[]) || [],
  );
  const [cidSearch, setCidSearch] = useState("");

  const { data: chargeItemDefinitions, isLoading } = useQuery({
    queryKey: ["charge_item_definitions", cidSearch],
    queryFn: query.debounced(chargeItemDefinitionApi.listChargeItemDefinition, {
      pathParams: { facilityId },
      queryParams: { limit: 100, status: "active", title: cidSearch },
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

      setPreviewChargeItem({
        title: selectedCID.title,
        status: ChargeItemStatus.billable,
        quantity: 1,
        unit_price_components: selectedCID.price_components,
        note: undefined,
        override_reason: undefined,
        encounter: encounterId,
      });
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

  const handleUpdateChargeItem = (index: number, updates: ChargeItemUpsert) => {
    const newChargeItems = chargeItems.map((ci, i: number) => {
      if (i !== index) return ci;
      return { ...ci, ...updates };
    });

    setChargeItems(newChargeItems);
    updateQuestionnaireResponseCB(
      [{ type: "charge_item", value: newChargeItems }],
      questionnaireResponse.question_id,
    );
  };

  const handlePreviewChargeItemUpdate = (updates: ChargeItemUpsert) => {
    if (!previewChargeItem) return;
    setPreviewChargeItem({ ...previewChargeItem, ...updates });
  };

  useEffect(() => {
    const initialChargeItems =
      (questionnaireResponse.values?.[0]?.value as ChargeItemUpsert[]) || [];

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
        <Autocomplete
          options={
            chargeItemDefinitions?.results?.map((cid) => ({
              label: cid.title,
              value: cid.id,
            })) || []
          }
          value={selectedChargeItemDefinition || ""}
          onChange={(value) => setSelectedChargeItemDefinition(value)}
          onSearch={setCidSearch}
          placeholder={t("select_charge_item_definition")}
          isLoading={isLoading}
          noOptionsMessage={t("no_charge_item_definitions_found")}
          disabled={disabled}
          data-cy="charge-item-definition-search"
        />
      </div>
    </div>
  );
}
