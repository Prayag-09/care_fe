import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckIcon, Loader2 } from "lucide-react";
import { navigate } from "raviger";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  MonetaryAmountInput,
  MonetaryDisplay,
} from "@/components/ui/monetary-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import Loading from "@/components/Common/Loading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  MonetaryComponent,
  MonetaryComponentRead,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import {
  ChargeItemDefinitionCreate,
  ChargeItemDefinitionRead,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import facilityApi from "@/types/facility/facilityApi";

import { summarizeMonetaryComponents } from "./utils";

// Schema for a single price component
const priceComponentSchema = z.object({
  monetary_component_type: z.nativeEnum(MonetaryComponentType),
  code: z
    .object({
      code: z.string(),
      system: z.string(),
      display: z.string(),
    })
    .nullable()
    .optional(),
  factor: z.number().min(0).max(100).nullable().optional(),
  amount: z.number().min(0).nullable().optional(),
});

// Main form schema
const formSchema = z.object({
  title: z.string().min(1, { message: "field_required" }),
  status: z.nativeEnum(ChargeItemDefinitionStatus),
  description: z.string().nullable(),
  purpose: z.string().nullable(),
  derived_from_uri: z.string().url().nullable(),
  price_component: z.array(priceComponentSchema).refine(
    (components) => {
      // Ensure there is exactly one base price component and it's the first one
      return (
        components.length > 0 &&
        components[0].monetary_component_type === MonetaryComponentType.base &&
        components.filter(
          (c) => c.monetary_component_type === MonetaryComponentType.base,
        ).length === 1
      );
    },
    {
      message:
        "Exactly one base price component is required as the first component",
    },
  ),
});

interface ChargeItemDefinitionFormProps {
  facilityId: string;
  initialData?: ChargeItemDefinitionRead;
  isUpdate?: boolean;
  onSuccess?: () => void;
}

// Component to display monetary value with label
function MonetaryValueDisplay({
  label,
  amount,
  type = "normal",
}: {
  label: React.ReactNode;
  amount: number;
  type?: "normal" | "positive" | "negative";
}) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-gray-600">{label}</span>
      <MonetaryDisplay
        data-coloring={type}
        className="font-medium text-gray-900 data-[coloring=positive]:text-green-600 data-[coloring=negative]:text-red-600"
        amount={amount}
      />
    </div>
  );
}

// Component for discount component selection with autocomplete
function DiscountSelectionSection({
  title,
  description,
  components,
  selectedComponents,
  onComponentToggle,
  onValueChange,
  summary,
}: {
  title: string;
  description: string;
  components: MonetaryComponentRead[];
  selectedComponents: MonetaryComponent[];
  onComponentToggle: (
    component: MonetaryComponentRead,
    selected: boolean,
  ) => void;
  onValueChange: (component: MonetaryComponent, value: number) => void;
  summary: number;
}) {
  const { t } = useTranslation();

  const isComponentSelected = (component: MonetaryComponentRead) =>
    selectedComponents.some(
      (c) =>
        c.code?.code === component.code?.code &&
        c.code?.system === component.code?.system,
    );

  const getComponentValue = (component: MonetaryComponent) => {
    return component.factor ?? component.amount ?? 0;
  };

  // Convert components to autocomplete options
  const availableOptions = components
    .filter((c) => !isComponentSelected(c))
    .map((c) => ({
      label: c.code?.display || c.title || "",
      value: `${c.code?.system}-${c.code?.code}`,
    }));

  // Function to handle selection from autocomplete
  const handleAutocompleteChange = (value: string) => {
    if (!value) return;

    const [system, code] = value.split("-");
    const component = components.find(
      (c) => c.code?.system === system && c.code?.code === code,
    );

    if (component) {
      onComponentToggle(component, true);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-red-50 rounded-lg border-red-100 border">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-red-900">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>

      {/* Selected Components */}
      <div className="space-y-3">
        {selectedComponents.map((component) => (
          <div
            key={`${component.code?.system}-${component.code?.code}`}
            className="p-3 rounded-lg bg-white border border-red-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{component.code?.display}</div>
                <div className="text-sm text-gray-500">
                  {component.code?.code}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const originalComponent = components.find(
                    (c) =>
                      c.code?.code === component.code?.code &&
                      c.code?.system === component.code?.system,
                  );
                  if (originalComponent) {
                    onComponentToggle(originalComponent, false);
                  }
                }}
              >
                {t("remove")}
              </Button>
            </div>

            <div className="mt-3 flex items-center space-x-2">
              <Input
                type="number"
                min="0"
                max={component.factor != null ? 100 : undefined}
                value={getComponentValue(component)}
                onChange={(e) =>
                  onValueChange(
                    {
                      ...component,
                      monetary_component_type: MonetaryComponentType.discount,
                    },
                    parseFloat(e.target.value),
                  )
                }
                className="text-right"
              />
              <span className="text-gray-500">
                {component.factor != null ? "%" : "₹"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Component */}
      <div className="mt-4">
        <Autocomplete
          options={availableOptions}
          value=""
          onChange={handleAutocompleteChange}
          placeholder={t("add_discount")}
          className="border-red-200"
        />
      </div>

      {/* Summary */}
      {selectedComponents.length > 0 && (
        <div className="mt-4 p-3 bg-white rounded-lg border">
          <MonetaryValueDisplay
            label={t("total_discounts")}
            amount={summary}
            type="negative"
          />
        </div>
      )}
    </div>
  );
}

// Component for tax component selection with checkboxes
function TaxSelectionSection({
  title,
  description,
  components,
  selectedComponents,
  onComponentToggle,
  onValueChange,
  summary,
}: {
  title: string;
  description: string;
  components: MonetaryComponentRead[];
  selectedComponents: MonetaryComponent[];
  onComponentToggle: (
    component: MonetaryComponentRead,
    selected: boolean,
  ) => void;
  onValueChange: (component: MonetaryComponent, value: number) => void;
  summary: number;
}) {
  const { t } = useTranslation();

  const isComponentSelected = (component: MonetaryComponentRead) =>
    selectedComponents.some(
      (c) =>
        c.code?.code === component.code?.code &&
        c.code?.system === component.code?.system,
    );

  const getComponentValue = (component: MonetaryComponentRead) => {
    const selected = selectedComponents.find(
      (c) =>
        c.code?.code === component.code?.code &&
        c.code?.system === component.code?.system,
    );
    return selected?.factor ?? selected?.amount ?? 0;
  };

  return (
    <div className="space-y-4 p-4 bg-blue-50 rounded-lg border-blue-100 border">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-blue-900">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>

      <div className="space-y-3">
        {components.map((component) => {
          const isSelected = isComponentSelected(component);
          return (
            <div
              key={`${component.code?.system}-${component.code?.code}`}
              className={`p-3 rounded-lg bg-white border transition-colors ${
                isSelected ? "border-blue-100" : "border-gray-100"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Checkbox
                  id={`tax-${component.code?.code}`}
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    onComponentToggle(component, checked === true)
                  }
                  className="h-5 w-5 border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white"
                />
                <div>
                  <label
                    htmlFor={`tax-${component.code?.code}`}
                    className="cursor-pointer font-medium"
                  >
                    {component.code?.display}
                  </label>
                  <p className="text-sm text-gray-500">
                    {component.code?.code}
                  </p>
                </div>
              </div>

              {isSelected && (
                <div className="mt-3 flex items-center space-x-2">
                  <Input
                    type="number"
                    min="0"
                    max={component.factor != null ? 100 : undefined}
                    value={getComponentValue(component)}
                    onChange={(e) =>
                      onValueChange(
                        {
                          ...component,
                          monetary_component_type: MonetaryComponentType.tax,
                        },
                        parseFloat(e.target.value),
                      )
                    }
                    className="text-right"
                  />
                  <span className="text-gray-500">
                    {component.factor != null ? "%" : "₹"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedComponents.length > 0 && (
        <div className="mt-4 p-3 bg-white rounded-lg border">
          <MonetaryValueDisplay
            label={t("total_taxes")}
            amount={summary}
            type="positive"
          />
        </div>
      )}
    </div>
  );
}

export function ChargeItemDefinitionForm({
  facilityId,
  initialData,
  isUpdate = false,
  onSuccess = () =>
    navigate(`/facility/${facilityId}/settings/charge_item_definitions`),
}: ChargeItemDefinitionFormProps) {
  const { t } = useTranslation();

  // Fetch facility data for available components
  const { data: facilityData, isLoading } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.getFacility, {
      pathParams: { id: facilityId },
    }),
  });

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      status: initialData?.status || ChargeItemDefinitionStatus.draft,
      description: initialData?.description || null,
      purpose: initialData?.purpose || null,
      derived_from_uri: initialData?.derived_from_uri || null,
      price_component: initialData?.price_component || [
        {
          monetary_component_type: MonetaryComponentType.base,
          amount: 0,
        },
      ],
    },
  });

  // Get current form values
  const priceComponents = form.watch("price_component");
  const basePrice = form.watch("price_component.0.amount");

  // Calculate price summary
  const priceSummary = useMemo(() => {
    return summarizeMonetaryComponents(priceComponents);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceComponents, basePrice]);

  // Handle form submission
  const { mutate: upsert, isPending } = useMutation({
    mutationFn: isUpdate
      ? mutate(chargeItemDefinitionApi.updateChargeItemDefinition, {
          pathParams: { facilityId, id: initialData!.id },
        })
      : mutate(chargeItemDefinitionApi.createChargeItemDefinition, {
          pathParams: { facilityId },
        }),
    onSuccess,
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const submissionData: ChargeItemDefinitionCreate = {
      ...values,
      slug: values.title.toLowerCase().replace(/\s+/g, "-"),
    };
    upsert(submissionData);
  };

  if (isLoading || !facilityData) {
    return <Loading />;
  }

  // Get all available components
  const availableDiscounts = [
    ...facilityData.discount_monetary_components,
    ...facilityData.instance_discount_monetary_components,
  ];
  const availableTaxes = [...facilityData.instance_tax_monetary_components];

  // Get currently selected components by type
  const getSelectedComponents = (type: MonetaryComponentType) =>
    priceComponents.filter((c) => c.monetary_component_type === type);

  // Handle component selection
  const handleComponentToggle = (
    component: MonetaryComponentRead,
    selected: boolean,
    type: MonetaryComponentType = MonetaryComponentType.tax,
  ) => {
    const currentComponents = form.getValues("price_component");
    let newComponents: MonetaryComponent[];

    if (selected) {
      newComponents = [
        ...currentComponents,
        {
          ...component,
          monetary_component_type: type,
        },
      ];
    } else {
      newComponents = currentComponents.filter(
        (c) =>
          !(
            c.code?.code === component.code?.code &&
            c.code?.system === component.code?.system
          ),
      );
    }

    form.setValue("price_component", newComponents, { shouldValidate: true });
  };

  // Handle component value change
  const handleComponentValueChange = (
    component: MonetaryComponent,
    value: number,
  ) => {
    const currentComponents = form.getValues("price_component");
    const componentIndex = currentComponents.findIndex(
      (c) =>
        c.code?.code === component.code?.code &&
        c.code?.system === component.code?.system,
    );

    if (componentIndex === -1) return;

    const newComponents = [...currentComponents];
    newComponents[componentIndex] = {
      ...component,
      [component.factor != null ? "factor" : "amount"]: value,
    };

    form.setValue("price_component", newComponents, { shouldValidate: true });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("basic_information")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("title")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("title")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("status")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_status")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ChargeItemDefinitionStatus).map(
                          (status) => (
                            <SelectItem key={status} value={status}>
                              {t(status)}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t("additional_details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("purpose")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="derived_from_uri"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("derived_from_uri")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Pricing Components */}
        <Card>
          <CardHeader>
            <CardTitle>{t("pricing_components")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Base Price */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">{t("base_price")}</h4>
                <div className="w-48">
                  <FormField
                    control={form.control}
                    name="price_component.0.amount"
                    render={({ field }) => (
                      <MonetaryAmountInput
                        {...field}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        placeholder="0.00"
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Discounts - Using Autocomplete */}
            <DiscountSelectionSection
              title={t("discounts")}
              description={t("select_applicable_discounts")}
              components={availableDiscounts}
              selectedComponents={getSelectedComponents(
                MonetaryComponentType.discount,
              )}
              onComponentToggle={(component, selected) =>
                handleComponentToggle(
                  component,
                  selected,
                  MonetaryComponentType.discount,
                )
              }
              onValueChange={handleComponentValueChange}
              summary={priceSummary.netAmount - priceSummary.taxableAmount}
            />

            {/* Taxes - Using Checkboxes */}
            <TaxSelectionSection
              title={t("taxes")}
              description={t("select_applicable_taxes")}
              components={availableTaxes}
              selectedComponents={getSelectedComponents(
                MonetaryComponentType.tax,
              )}
              onComponentToggle={(component, selected) =>
                handleComponentToggle(
                  component,
                  selected,
                  MonetaryComponentType.tax,
                )
              }
              onValueChange={handleComponentValueChange}
              summary={priceSummary.totalAmount - priceSummary.taxableAmount}
            />

            {/* Price Summary */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100">
              <h4 className="font-medium text-green-900 mb-3">
                {t("price_summary")}
              </h4>
              <div className="space-y-2 divide-y divide-green-200">
                <MonetaryValueDisplay
                  label={t("base_price")}
                  amount={priceSummary.baseAmount}
                />
                <MonetaryValueDisplay
                  label={t("total_discounts")}
                  amount={priceSummary.netAmount - priceSummary.taxableAmount}
                  type="negative"
                />
                <MonetaryValueDisplay
                  label={t("total_taxes")}
                  amount={priceSummary.totalAmount - priceSummary.taxableAmount}
                  type="positive"
                />

                <div className="flex justify-between items-center py-2 pt-3">
                  <span className="text-gray-600 text-lg font-bold">
                    {t("final_price")}
                  </span>
                  <MonetaryDisplay
                    className="font-bold text-green-600 text-lg"
                    amount={priceSummary.totalAmount}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess()}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving")}
              </>
            ) : (
              <>
                <CheckIcon className="mr-2 h-4 w-4" />
                {isUpdate ? t("update") : t("create")}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
