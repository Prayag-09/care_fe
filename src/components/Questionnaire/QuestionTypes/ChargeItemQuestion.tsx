import { useQuery } from "@tanstack/react-query";
import { ChevronsDownUp, ChevronsUpDown, Trash2, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { FieldError } from "@/components/Questionnaire/QuestionTypes/FieldError";

import query from "@/Utils/request/query";
import {
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import {
  ChargeItemBase,
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

interface PriceComponentSummaryProps {
  priceComponents: MonetaryComponent[];
  quantity?: number;
}

function PriceComponentSummary({
  priceComponents,
  quantity = 1,
}: PriceComponentSummaryProps) {
  const { t } = useTranslation();

  if (!priceComponents?.length) return null;

  const baseComponents = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.base,
  );
  const taxComponents = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.tax,
  );
  const discountComponents = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.discount,
  );
  const surchargeComponents = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.surcharge,
  );

  const baseUnitAmount = baseComponents[0]?.amount || 0;
  const baseAmount = baseUnitAmount * quantity;

  const discountTotal = discountComponents.reduce((total, component) => {
    return total + (baseAmount * (component.factor || 0)) / 100;
  }, 0);

  const surchargeTotal = surchargeComponents.reduce((total, component) => {
    return total + (baseAmount * (component.factor || 0)) / 100;
  }, 0);

  const netAmount = baseAmount + surchargeTotal - discountTotal;

  const taxTotal = taxComponents.reduce((total, component) => {
    return total + (netAmount * (component.factor || 0)) / 100;
  }, 0);

  const totalAmount = netAmount + taxTotal;

  return (
    <div className="mt-4 border rounded-md p-4 bg-muted/20">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{t("base_amount")}</span>
          <MonetaryDisplay amount={baseAmount} />
        </div>

        {surchargeComponents.map((component, index) => (
          <div
            key={`surcharge-${index}`}
            className="flex justify-between text-sm text-gray-500"
          >
            <span>
              {component.code?.display || t("surcharge")} ({t("surcharge")})
            </span>
            <span>
              +{" "}
              <MonetaryDisplay
                amount={(baseAmount * (component.factor || 0)) / 100}
              />{" "}
              ({component.factor}%)
            </span>
          </div>
        ))}

        {discountComponents.map((component, index) => (
          <div
            key={`discount-${index}`}
            className="flex justify-between text-sm text-gray-500"
          >
            <span>
              {component.code?.display || t("discount")} ({t("discount")})
            </span>
            <span>
              -{" "}
              <MonetaryDisplay
                amount={(baseAmount * (component.factor || 0)) / 100}
              />{" "}
              ({component.factor}%)
            </span>
          </div>
        ))}

        {taxComponents.map((component, index) => (
          <div
            key={`tax-${index}`}
            className="flex justify-between text-sm text-gray-500"
          >
            <span>
              {component.code?.display || t("tax")} ({t("tax")})
            </span>
            <span>
              +{" "}
              <MonetaryDisplay
                amount={(netAmount * (component.factor || 0)) / 100}
              />{" "}
              ({component.factor}%)
            </span>
          </div>
        ))}

        <Separator className="my-2" />

        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t("net_amount")}</span>
          <MonetaryDisplay amount={netAmount} />
        </div>

        <div className="flex justify-between font-semibold">
          <span>{t("total_amount")}</span>
          <MonetaryDisplay amount={totalAmount} />
        </div>
      </div>
    </div>
  );
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
  defaultOpen = true,
}: ChargeItemFormProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(defaultOpen);

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

  return (
    <Collapsible defaultOpen={defaultOpen} onOpenChange={setIsOpen}>
      <div className="rounded-md border border-gray-200">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-2 hover:bg-gray-50 cursor-pointer">
          <div className="flex flex-col gap-1 items-start">
            <p className="text-sm font-semibold">{chargeItem.title}</p>
            <div className="flex items-center gap-2">
              <div className="text-sm mt-1 text-gray-600 capitalize flex items-center gap-1 justify-center">
                {chargeItem.status}
                <span className="text-gray-600 font-semibold">{" . "}</span>
                <span className="text-sm text-gray-600">
                  {chargeItem.quantity || 0}
                </span>
                <XIcon className="size-4" />
                <span className="text-sm text-gray-600">
                  {chargeItem.unit_price_components?.[0]?.amount || 0}{" "}
                  {chargeItem.unit_price_components?.[0]?.code?.code || "INR"}
                </span>
              </div>
            </div>
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

            <Button
              variant="ghost"
              size="icon"
              className="size-10 border border-gray-400 bg-white shadow p-4 pointer-events-none"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <ChevronsDownUp className="size-5" />
              ) : (
                <ChevronsUpDown className="size-5" />
              )}
            </Button>
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

              <div className="space-y-2 col-span-2">
                <Label>{t("note")}</Label>
                <textarea
                  value={chargeItem.note || ""}
                  onChange={(e) =>
                    onUpdate?.({ ...chargeItem, note: e.target.value })
                  }
                  disabled={disabled}
                  placeholder={t("add_notes")}
                  className="field-sizing-content focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 rounded-md w-full"
                />
              </div>
            </div>

            {chargeItem.unit_price_components?.length > 0 && (
              <PriceComponentSummary
                priceComponents={chargeItem.unit_price_components}
                quantity={chargeItem.quantity}
              />
            )}
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
        unit_price_components: selectedCID.price_component,
        note: undefined,
        override_reason: undefined,
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
      (questionnaireResponse.values?.[0]?.value as ChargeItemBase[]) || [];

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
