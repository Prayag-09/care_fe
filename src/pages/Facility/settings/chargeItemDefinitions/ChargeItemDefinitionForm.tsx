import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import mutate from "@/Utils/request/mutate";
import {
  MonetoryComponent,
  MonetoryComponentType,
} from "@/types/base/monetoryComponent/monetoryComponent";
import {
  ChargeItemDefinitionCreate,
  ChargeItemDefinitionRead,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";

interface ChargeItemDefinitionFormProps {
  facilityId: string;
  initialData?: ChargeItemDefinitionRead;
  isUpdate?: boolean;
  onSuccess?: () => void;
}

// Define a CodeSchema that matches the Code type
const CodeSchema = z.object({
  code: z.string(),
  display: z.string(),
  system: z.string(),
});

const priceComponentSchema = z
  .object({
    monetory_component_type: z.nativeEnum(MonetoryComponentType),
    code: CodeSchema.nullable().optional(),
    amount: z.number().nullable().optional(),
    factor: z.number().nullable().optional(),
  })
  .refine(
    (data) => {
      // At least one of amount or factor must be defined and not null
      return (
        (data.amount !== undefined && data.amount !== null) ||
        (data.factor !== undefined && data.factor !== null)
      );
    },
    {
      message: "Either amount or factor must be provided",
      path: ["amount"], // Highlight the amount field for the error
    },
  );

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  status: z.nativeEnum(ChargeItemDefinitionStatus),
  description: z.string().nullable(),
  purpose: z.string().nullable(),
  derived_from_uri: z.string().nullable(),
  price_component: z.array(priceComponentSchema),
});

// Define extended form schema type that includes values after submission
type FormValues = z.infer<typeof formSchema>;

export function ChargeItemDefinitionForm({
  facilityId,
  initialData,
  isUpdate = false,
  onSuccess = () =>
    navigate(`/facility/${facilityId}/settings/charge_item_definitions`),
}: ChargeItemDefinitionFormProps) {
  const { t } = useTranslation();
  const [priceComponents, setPriceComponents] = useState<MonetoryComponent[]>(
    initialData?.price_component || [],
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: "",
      status: ChargeItemDefinitionStatus.draft,
      description: null,
      purpose: null,
      derived_from_uri: null,
      price_component: [],
    },
  });

  // Watch form values for debugging
  const watchedValues = useWatch({
    control: form.control,
  });

  // Update priceComponents state when watchedValues.price_component changes
  useEffect(() => {
    if (
      watchedValues.price_component &&
      watchedValues.price_component.length > 0
    ) {
      console.log(
        "Watched price components updated:",
        watchedValues.price_component,
      );
      setPriceComponents(watchedValues.price_component as MonetoryComponent[]);
    }
  }, [watchedValues.price_component]);

  const {
    mutate: submitForm,
    isPending,
    error,
  } = useMutation({
    mutationFn: (data: FormValues) => {
      // Prepare the final submission data with slug
      // Ensure all price components have required fields and clean any null/undefined values
      const cleanedPriceComponents = data.price_component.map((comp) => ({
        monetory_component_type: comp.monetory_component_type,
        // Only include code if it exists
        ...(comp.code && { code: comp.code }),
        // Only include the non-null value between amount and factor
        ...(comp.amount !== null && comp.amount !== undefined
          ? { amount: comp.amount }
          : {}),
        ...(comp.factor !== null && comp.factor !== undefined
          ? { factor: comp.factor }
          : {}),
      }));

      const submissionData: ChargeItemDefinitionCreate = {
        ...data,
        price_component: cleanedPriceComponents,
        slug: data.title.toLowerCase().replace(/\s+/g, "-"),
      };

      console.log("Submission data:", JSON.stringify(submissionData, null, 2));

      if (isUpdate && initialData) {
        console.log(`Updating charge item definition: ${initialData.id}`);
        return mutate(chargeItemDefinitionApi.updateChargeItemDefinition, {
          pathParams: { facilityId, chargeItemDefinitionId: initialData.id },
        })(submissionData);
      } else {
        console.log("Creating new charge item definition");
        return mutate(chargeItemDefinitionApi.createChargeItemDefinition, {
          pathParams: { facilityId },
        })(submissionData);
      }
    },
    onSuccess: (response) => {
      console.log("Success response:", JSON.stringify(response, null, 2));
      onSuccess();
    },
    onError: (err) => {
      console.error("Mutation error:", err);
      // Display detailed error information if available
      if (err instanceof Error) {
        console.error("Error message:", err.message);
        console.error("Error details:", err);
      }
    },
  });

  const onSubmit = (values: FormValues) => {
    console.log("Form submitted with values:", JSON.stringify(values, null, 2));

    // Validate price components
    if (values.price_component.length === 0) {
      form.setError("price_component", {
        type: "custom",
        message: "At least one price component is required",
      });
      console.error("At least one price component is required");
      return;
    }

    // Validate that each price component has either amount or factor
    const isValid = values.price_component.every((component) => {
      return (
        (component.amount !== null && component.amount !== undefined) ||
        (component.factor !== null && component.factor !== undefined)
      );
    });

    if (!isValid) {
      form.setError("price_component", {
        type: "custom",
        message: "Each price component must have either an amount or a factor",
      });
      console.error(
        "Each price component must have either an amount or a factor",
      );
      return;
    }

    submitForm(values);
  };

  const handleSubmit = form.handleSubmit(onSubmit, (errors) => {
    console.error("Form validation errors:", errors);
  });

  const addPriceComponent = () => {
    const newComponent: MonetoryComponent = {
      monetory_component_type: MonetoryComponentType.base,
      amount: 0, // Default to 0 to satisfy validation
      factor: null,
    };

    const updatedComponents = [...priceComponents, newComponent];
    setPriceComponents(updatedComponents);
    form.setValue("price_component", updatedComponents, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const removePriceComponent = (index: number) => {
    const updatedComponents = [...priceComponents];
    updatedComponents.splice(index, 1);
    setPriceComponents(updatedComponents);
    form.setValue("price_component", updatedComponents, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const updatePriceComponent = (
    index: number,
    field: keyof MonetoryComponent,
    value: any,
  ) => {
    // Clear any form errors when user makes changes
    form.clearErrors();

    const updatedComponents = [...priceComponents];

    switch (field) {
      case "monetory_component_type": {
        updatedComponents[index].monetory_component_type =
          value as MonetoryComponentType;
        break;
      }
      case "amount": {
        // If value is null or empty string, allow it to be null for UI flexibility
        // The form will validate before submission to ensure one of amount/factor is provided
        let numValue = value !== null && value !== "" ? Number(value) : null;
        updatedComponents[index].amount = numValue;
        break;
      }
      case "factor": {
        // If value is null or empty string, allow it to be null for UI flexibility
        let factorValue = value !== null && value !== "" ? Number(value) : null;
        updatedComponents[index].factor = factorValue;
        break;
      }
      default: {
        (updatedComponents[index] as any)[field] = value;
      }
    }

    setPriceComponents(updatedComponents);
    form.setValue("price_component", updatedComponents, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  // Show any errors from the mutation
  if (error) {
    console.error("Form submission error:", error);
  }

  // Safe formatter
  const safeFormat = (value: number | null | undefined) => {
    try {
      if (value === null || value === undefined) return "0.00";
      return value.toFixed(2);
    } catch (e) {
      console.error("Error in formatting:", e);
      return "0.00";
    }
  };

  return (
    <Form {...form}>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500">
          {error.message || "An error occurred while saving the form"}
        </div>
      )}

      {form.formState.errors.price_component?.message && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500">
          {form.formState.errors.price_component.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("basic_information")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("title")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                      <SelectItem value={ChargeItemDefinitionStatus.draft}>
                        {t(ChargeItemDefinitionStatus.draft)}
                      </SelectItem>
                      <SelectItem value={ChargeItemDefinitionStatus.active}>
                        {t(ChargeItemDefinitionStatus.active)}
                      </SelectItem>
                      <SelectItem value={ChargeItemDefinitionStatus.retired}>
                        {t(ChargeItemDefinitionStatus.retired)}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("price_components")}</CardTitle>
            <Button type="button" variant="outline" onClick={addPriceComponent}>
              <CareIcon icon="l-plus" className="mr-2" />
              {t("add_price_component")}
            </Button>
          </CardHeader>
          <CardContent>
            {priceComponents.length === 0 ? (
              <div className="py-4 text-center text-gray-500">
                <p>{t("no_price_components")}</p>
                <p className="text-sm">
                  {t("add_price_component_instruction")}
                </p>
                {form.formState.errors.price_component && (
                  <p className="text-red-500 mt-2 text-sm">
                    {t("at_least_one_price_component_required")}
                  </p>
                )}
              </div>
            ) : (
              <div>
                {/* Spreadsheet-like header */}
                <div className="overflow-hidden border rounded-md mb-4 shadow-sm">
                  <div className="grid grid-cols-12 gap-2 bg-gray-50 p-2 font-medium border-b">
                    <div className="col-span-1 py-2 px-2">{t("seq")}</div>
                    <div className="col-span-3 py-2 px-2">
                      {t("component_type")}
                    </div>
                    <div className="col-span-3 py-2 px-2">{t("amount")}</div>
                    <div className="col-span-3 py-2 px-2">
                      {t("factor")} (%)
                    </div>
                    <div className="col-span-2 text-right py-2 px-2">
                      {t("actions")}
                    </div>
                  </div>

                  {/* Component rows */}
                  <div>
                    {priceComponents.map((component, index) => {
                      // Set row color based on component type
                      let rowColorClass = "";
                      if (
                        component.monetory_component_type ===
                        MonetoryComponentType.discount
                      ) {
                        rowColorClass = "bg-red-50";
                      } else if (
                        component.monetory_component_type ===
                        MonetoryComponentType.tax
                      ) {
                        rowColorClass = "bg-blue-50";
                      } else if (
                        component.monetory_component_type ===
                        MonetoryComponentType.informational
                      ) {
                        rowColorClass = "bg-gray-50";
                      }

                      return (
                        <div
                          key={index}
                          className={`grid grid-cols-12 gap-2 items-center p-2 border-b hover:bg-gray-50 ${rowColorClass}`}
                        >
                          <div className="col-span-1 text-sm text-gray-500 font-bold px-2">
                            {index + 1}
                          </div>
                          <div className="col-span-3">
                            <Select
                              value={component.monetory_component_type}
                              onValueChange={(value) =>
                                updatePriceComponent(
                                  index,
                                  "monetory_component_type",
                                  value,
                                )
                              }
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue
                                  placeholder={t("select_component_type")}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={MonetoryComponentType.base}>
                                  <span className="font-medium">
                                    {t("base_price")}
                                  </span>
                                </SelectItem>
                                <SelectItem
                                  value={MonetoryComponentType.surcharge}
                                >
                                  <span className="font-medium">
                                    {t("surcharge")}
                                  </span>
                                </SelectItem>
                                <SelectItem
                                  value={MonetoryComponentType.discount}
                                >
                                  <span className="text-red-500 font-medium">
                                    {t("discount")}
                                  </span>
                                  <span className="text-xs ml-1">
                                    ({t("applies_before_tax")})
                                  </span>
                                </SelectItem>
                                <SelectItem value={MonetoryComponentType.tax}>
                                  <span className="text-blue-500 font-medium">
                                    {t("tax")}
                                  </span>
                                  <span className="text-xs ml-1">
                                    ({t("applies_at_end")})
                                  </span>
                                </SelectItem>
                                <SelectItem
                                  value={MonetoryComponentType.informational}
                                >
                                  <span className="text-gray-500 font-medium">
                                    {t("informational")}
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="col-span-3">
                            <div className="relative">
                              <Input
                                type="number"
                                value={component.amount ?? ""}
                                onChange={(e) => {
                                  updatePriceComponent(
                                    index,
                                    "amount",
                                    e.target.value === ""
                                      ? null
                                      : e.target.value,
                                  );
                                }}
                                placeholder="0.00"
                                className={
                                  !component.amount && !component.factor
                                    ? "border-red-500 h-9 pl-6"
                                    : "h-9 pl-6"
                                }
                              />
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                                ₹
                              </span>
                            </div>
                          </div>

                          <div className="col-span-3">
                            <div className="relative">
                              <Input
                                type="number"
                                value={
                                  component.factor !== null &&
                                  component.factor !== undefined
                                    ? component.factor * 100
                                    : ""
                                }
                                onChange={(e) => {
                                  // Convert percentage input back to decimal factor
                                  const percentValue =
                                    e.target.value === ""
                                      ? null
                                      : parseFloat(e.target.value);
                                  const factorValue =
                                    percentValue !== null
                                      ? percentValue / 100
                                      : null;

                                  updatePriceComponent(
                                    index,
                                    "factor",
                                    factorValue,
                                  );
                                }}
                                placeholder="0.00"
                                className={
                                  !component.amount && !component.factor
                                    ? "border-red-500 h-9 pr-6"
                                    : "h-9 pr-6"
                                }
                              />
                              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                                %
                              </span>
                            </div>
                          </div>

                          <div className="col-span-2 flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                // Clone this component and add it as new
                                const newComponent = { ...component };
                                const updatedComponents = [
                                  ...priceComponents,
                                  newComponent,
                                ];
                                setPriceComponents(updatedComponents);
                                form.setValue(
                                  "price_component",
                                  updatedComponents,
                                  {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                    shouldValidate: true,
                                  },
                                );
                              }}
                              title={t("duplicate")}
                            >
                              <CareIcon
                                icon="l-copy"
                                className="size-4 text-gray-500"
                              />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePriceComponent(index)}
                              title={t("delete")}
                            >
                              <CareIcon
                                icon="l-trash"
                                className="size-4 text-red-500"
                              />
                            </Button>
                          </div>

                          {!component.amount && !component.factor && (
                            <div className="col-span-12">
                              <p className="text-xs text-red-500 px-2">
                                {t("either_amount_or_factor_required")}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Price calculation summary */}
                  <div className="mt-6 border-t pt-4">
                    <div className="text-lg font-medium mb-2">
                      {t("price_calculation_preview")}
                    </div>

                    <div className="bg-white border rounded-md overflow-hidden shadow-sm">
                      {/* Interactive calculator header with sample base amount toggle */}
                      <div className="bg-gray-50 p-3 flex items-center justify-between">
                        <div className="font-medium">
                          {t("calculation_preview")}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm">
                            {t("sample_base_amount")}:
                          </span>
                          <Input
                            type="number"
                            className="w-24 h-8"
                            defaultValue="1000"
                            id="sample-base-amount"
                          />
                        </div>
                      </div>

                      {/* Calculation detail table */}
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-y">
                          <tr>
                            <th className="py-2 px-3 text-left">
                              {t("component")}
                            </th>
                            <th className="py-2 px-3 text-left">{t("type")}</th>
                            <th className="py-2 px-3 text-right">
                              {t("value")}
                            </th>
                            <th className="py-2 px-3 text-right">
                              {t("calculation")}
                            </th>
                            <th className="py-2 px-3 text-right">
                              {t("result")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            try {
                              const sampleBaseAmount = 1000; // This would be from the input above
                              let runningTotal = 0;
                              let baseTotal = 0;

                              // Group components by type for the calculations
                              const bases = priceComponents.filter(
                                (c) =>
                                  c.monetory_component_type ===
                                  MonetoryComponentType.base,
                              );
                              const surcharges = priceComponents.filter(
                                (c) =>
                                  c.monetory_component_type ===
                                  MonetoryComponentType.surcharge,
                              );
                              const discounts = priceComponents.filter(
                                (c) =>
                                  c.monetory_component_type ===
                                  MonetoryComponentType.discount,
                              );
                              const taxes = priceComponents.filter(
                                (c) =>
                                  c.monetory_component_type ===
                                  MonetoryComponentType.tax,
                              );
                              const informational = priceComponents.filter(
                                (c) =>
                                  c.monetory_component_type ===
                                  MonetoryComponentType.informational,
                              );

                              // Start with base amounts
                              const rows = [];

                              // Process base components
                              bases.forEach((comp, i) => {
                                // Safely handle null/undefined values
                                const safeAmount =
                                  comp.amount !== null &&
                                  comp.amount !== undefined
                                    ? comp.amount
                                    : 0;
                                const safeFactor =
                                  comp.factor !== null &&
                                  comp.factor !== undefined
                                    ? comp.factor
                                    : 0;

                                // Calculate value safely, preferring amount if present
                                const value =
                                  comp.amount !== null &&
                                  comp.amount !== undefined
                                    ? safeAmount
                                    : comp.factor !== null &&
                                        comp.factor !== undefined
                                      ? safeFactor * sampleBaseAmount
                                      : 0;

                                baseTotal += value;
                                runningTotal += value;

                                rows.push(
                                  <tr key={`base-${i}`} className="border-b">
                                    <td className="py-2 px-3 font-medium">
                                      {t("base_price")} {i + 1}
                                    </td>
                                    <td className="py-2 px-3">
                                      {comp.amount !== null &&
                                      comp.amount !== undefined
                                        ? t("fixed_amount")
                                        : comp.factor !== null &&
                                            comp.factor !== undefined
                                          ? t("percentage_of_base")
                                          : t("not_specified")}
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      {comp.amount !== null &&
                                      comp.amount !== undefined
                                        ? safeFormat(safeAmount)
                                        : comp.factor !== null &&
                                            comp.factor !== undefined
                                          ? `${safeFormat(safeFactor * 100)}%`
                                          : "-"}
                                    </td>
                                    <td className="py-2 px-3 text-right text-gray-500">
                                      {comp.amount !== null &&
                                      comp.amount !== undefined
                                        ? safeFormat(safeAmount)
                                        : comp.factor !== null &&
                                            comp.factor !== undefined
                                          ? `${safeFormat(sampleBaseAmount)} × ${safeFormat(safeFactor * 100)}%`
                                          : "-"}
                                    </td>
                                    <td className="py-2 px-3 text-right font-medium">
                                      {safeFormat(value)}
                                    </td>
                                  </tr>,
                                );
                              });

                              // Process surcharge components
                              surcharges.forEach((comp, i) => {
                                // Safely handle null/undefined values
                                const safeAmount =
                                  comp.amount !== null &&
                                  comp.amount !== undefined
                                    ? comp.amount
                                    : 0;
                                const safeFactor =
                                  comp.factor !== null &&
                                  comp.factor !== undefined
                                    ? comp.factor
                                    : 0;

                                // Calculate value safely, preferring amount if present
                                const value =
                                  comp.amount !== null &&
                                  comp.amount !== undefined
                                    ? safeAmount
                                    : comp.factor !== null &&
                                        comp.factor !== undefined
                                      ? safeFactor * baseTotal
                                      : 0;

                                runningTotal += value;

                                rows.push(
                                  <tr
                                    key={`surcharge-${i}`}
                                    className="border-b"
                                  >
                                    <td className="py-2 px-3 font-medium">
                                      {t("surcharge")} {i + 1}
                                    </td>
                                    <td className="py-2 px-3">
                                      {comp.amount !== null &&
                                      comp.amount !== undefined
                                        ? t("fixed_amount")
                                        : comp.factor !== null &&
                                            comp.factor !== undefined
                                          ? t("percentage_of_base")
                                          : t("not_specified")}
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      {comp.amount !== null &&
                                      comp.amount !== undefined
                                        ? safeFormat(safeAmount)
                                        : comp.factor !== null &&
                                            comp.factor !== undefined
                                          ? `${safeFormat(safeFactor * 100)}%`
                                          : "-"}
                                    </td>
                                    <td className="py-2 px-3 text-right text-gray-500">
                                      {comp.amount !== null &&
                                      comp.amount !== undefined
                                        ? safeFormat(safeAmount)
                                        : comp.factor !== null &&
                                            comp.factor !== undefined
                                          ? `${safeFormat(baseTotal)} × ${safeFormat(safeFactor * 100)}%`
                                          : "-"}
                                    </td>
                                    <td className="py-2 px-3 text-right font-medium">
                                      {safeFormat(value)}
                                    </td>
                                  </tr>,
                                );
                              });

                              // Subtotal before discounts
                              const subtotalBeforeDiscounts = runningTotal;
                              rows.push(
                                <tr
                                  key="subtotal-before-discounts"
                                  className="bg-gray-50 border-b"
                                >
                                  <td
                                    colSpan={4}
                                    className="py-2 px-3 font-medium"
                                  >
                                    {t("subtotal_before_discounts")}
                                  </td>
                                  <td className="py-2 px-3 text-right font-medium">
                                    {safeFormat(subtotalBeforeDiscounts)}
                                  </td>
                                </tr>,
                              );

                              // Process discount components
                              discounts.forEach((comp, i) => {
                                // Safely handle null/undefined values
                                const safeAmount =
                                  comp.amount !== null &&
                                  comp.amount !== undefined
                                    ? comp.amount
                                    : 0;
                                const safeFactor =
                                  comp.factor !== null &&
                                  comp.factor !== undefined
                                    ? comp.factor
                                    : 0;

                                // Calculate value safely, preferring amount if present
                                const value =
                                  comp.amount !== null &&
                                  comp.amount !== undefined
                                    ? safeAmount
                                    : comp.factor !== null &&
                                        comp.factor !== undefined
                                      ? safeFactor * subtotalBeforeDiscounts
                                      : 0;

                                runningTotal -= value;

                                rows.push(
                                  <tr
                                    key={`discount-${i}`}
                                    className="border-b text-red-500"
                                  >
                                    <td className="py-2 px-3 font-medium">
                                      {t("discount")} {i + 1}
                                    </td>
                                    <td className="py-2 px-3">
                                      {comp.amount !== null &&
                                      comp.amount !== undefined
                                        ? t("fixed_amount")
                                        : comp.factor !== null &&
                                            comp.factor !== undefined
                                          ? t("percentage_of_subtotal")
                                          : t("not_specified")}
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      {comp.amount !== null &&
                                      comp.amount !== undefined
                                        ? safeFormat(safeAmount)
                                        : comp.factor !== null &&
                                            comp.factor !== undefined
                                          ? `${safeFormat(safeFactor * 100)}%`
                                          : "-"}
                                    </td>
                                    <td className="py-2 px-3 text-right text-red-400">
                                      {comp.amount !== null &&
                                      comp.amount !== undefined
                                        ? safeFormat(safeAmount)
                                        : comp.factor !== null &&
                                            comp.factor !== undefined
                                          ? `${safeFormat(subtotalBeforeDiscounts)} × ${safeFormat(safeFactor * 100)}%`
                                          : "-"}
                                    </td>
                                    <td className="py-2 px-3 text-right font-medium">
                                      -{safeFormat(value)}
                                    </td>
                                  </tr>,
                                );
                              });

                              // Subtotal after discounts (before taxes)
                              const subtotalAfterDiscounts = runningTotal;
                              rows.push(
                                <tr
                                  key="subtotal-after-discounts"
                                  className="bg-gray-50 border-b font-medium"
                                >
                                  <td colSpan={4} className="py-2 px-3">
                                    {t("subtotal_after_discounts")}
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    {safeFormat(subtotalAfterDiscounts)}
                                  </td>
                                </tr>,
                              );

                              // Process tax components
                              taxes.forEach((comp, i) => {
                                // Safely handle null/undefined values
                                const safeAmount =
                                  comp.amount !== null &&
                                  comp.amount !== undefined
                                    ? comp.amount
                                    : 0;
                                const safeFactor =
                                  comp.factor !== null &&
                                  comp.factor !== undefined
                                    ? comp.factor
                                    : 0;

                                // Calculate value safely, preferring amount if present
                                const value =
                                  comp.amount !== null &&
                                  comp.amount !== undefined
                                    ? safeAmount
                                    : comp.factor !== null &&
                                        comp.factor !== undefined
                                      ? safeFactor * subtotalAfterDiscounts
                                      : 0;

                                runningTotal += value;

                                rows.push(
                                  <tr
                                    key={`tax-${i}`}
                                    className="border-b text-blue-500"
                                  >
                                    <td className="py-2 px-3 font-medium">
                                      {t("tax")} {i + 1}
                                    </td>
                                    <td className="py-2 px-3">
                                      {comp.amount !== null &&
                                      comp.amount !== undefined
                                        ? t("fixed_amount")
                                        : comp.factor !== null &&
                                            comp.factor !== undefined
                                          ? t("percentage_of_subtotal")
                                          : t("not_specified")}
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      {comp.amount !== null &&
                                      comp.amount !== undefined
                                        ? safeFormat(safeAmount)
                                        : comp.factor !== null &&
                                            comp.factor !== undefined
                                          ? `${safeFormat(safeFactor * 100)}%`
                                          : "-"}
                                    </td>
                                    <td className="py-2 px-3 text-right text-blue-400">
                                      {comp.amount !== null &&
                                      comp.amount !== undefined
                                        ? safeFormat(safeAmount)
                                        : comp.factor !== null &&
                                            comp.factor !== undefined
                                          ? `${safeFormat(subtotalAfterDiscounts)} × ${safeFormat(safeFactor * 100)}%`
                                          : "-"}
                                    </td>
                                    <td className="py-2 px-3 text-right font-medium">
                                      {safeFormat(value)}
                                    </td>
                                  </tr>,
                                );
                              });

                              // Final total
                              rows.push(
                                <tr
                                  key="total"
                                  className="bg-gray-100 font-bold text-lg"
                                >
                                  <td colSpan={4} className="py-3 px-3">
                                    {t("total")}
                                  </td>
                                  <td className="py-3 px-3 text-right">
                                    {safeFormat(runningTotal)}
                                  </td>
                                </tr>,
                              );

                              // Add any informational components (not part of actual calculation)
                              informational.forEach((comp, i) => {
                                // Safely handle null/undefined values
                                const safeAmount =
                                  comp.amount !== null &&
                                  comp.amount !== undefined
                                    ? comp.amount
                                    : 0;
                                const safeFactor =
                                  comp.factor !== null &&
                                  comp.factor !== undefined
                                    ? comp.factor
                                    : 0;

                                // Calculate value safely
                                const value =
                                  comp.amount !== null &&
                                  comp.amount !== undefined
                                    ? safeAmount
                                    : comp.factor !== null &&
                                        comp.factor !== undefined
                                      ? safeFactor * runningTotal
                                      : 0;

                                rows.push(
                                  <tr
                                    key={`info-${i}`}
                                    className="border-b text-gray-500 italic"
                                  >
                                    <td className="py-2 px-3 font-medium">
                                      {t("informational")} {i + 1}
                                    </td>
                                    <td className="py-2 px-3">
                                      {comp.amount !== null &&
                                      comp.amount !== undefined
                                        ? t("fixed_amount")
                                        : comp.factor !== null &&
                                            comp.factor !== undefined
                                          ? t("percentage_of_total")
                                          : t("not_specified")}
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      {comp.amount !== null &&
                                      comp.amount !== undefined
                                        ? safeFormat(safeAmount)
                                        : comp.factor !== null &&
                                            comp.factor !== undefined
                                          ? `${safeFormat(safeFactor * 100)}%`
                                          : "-"}
                                    </td>
                                    <td className="py-2 px-3 text-right">
                                      {comp.amount !== null &&
                                      comp.amount !== undefined
                                        ? safeFormat(safeAmount)
                                        : comp.factor !== null &&
                                            comp.factor !== undefined
                                          ? `${safeFormat(runningTotal)} × ${safeFormat(safeFactor * 100)}%`
                                          : "-"}
                                    </td>
                                    <td className="py-2 px-3 text-right font-medium">
                                      {safeFormat(value)}
                                    </td>
                                  </tr>,
                                );
                              });

                              return rows;
                            } catch (error) {
                              console.error(
                                "Error in price calculation:",
                                error,
                              );
                              return (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="py-3 px-3 text-center text-red-500"
                                  >
                                    {t("error_calculating_price")}
                                  </td>
                                </tr>
                              );
                            }
                          })()}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 bg-gray-50 p-4 rounded-md text-sm">
                      <div className="font-medium mb-2">
                        {t("price_component_calculation_rules")}
                      </div>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>
                          <strong>{t("base_price")}:</strong>{" "}
                          {t("base_price_explanation")}
                          <ul className="list-circle pl-5 mt-1 text-gray-600">
                            <li>{t("can_be_fixed_amount")}</li>
                            <li>{t("can_be_factor_of_reference_value")}</li>
                          </ul>
                        </li>
                        <li>
                          <strong>{t("surcharge")}:</strong>{" "}
                          {t("surcharge_explanation")}
                          <ul className="list-circle pl-5 mt-1 text-gray-600">
                            <li>{t("can_be_fixed_amount")}</li>
                            <li>
                              {t("surcharge_factor_applies_to_base_total")}
                            </li>
                          </ul>
                        </li>
                        <li>
                          <strong className="text-red-500">
                            {t("discount")}:
                          </strong>{" "}
                          {t("discount_explanation")}
                          <ul className="list-circle pl-5 mt-1 text-gray-600">
                            <li>{t("can_be_fixed_amount")}</li>
                            <li>
                              {t(
                                "discount_factor_applies_to_subtotal_before_discounts",
                              )}
                            </li>
                            <li>{t("applies_before_taxes")}</li>
                          </ul>
                        </li>
                        <li>
                          <strong className="text-blue-500">{t("tax")}:</strong>{" "}
                          {t("tax_explanation")}
                          <ul className="list-circle pl-5 mt-1 text-gray-600">
                            <li>{t("can_be_fixed_amount")}</li>
                            <li>
                              {t(
                                "tax_factor_applies_to_subtotal_after_discounts",
                              )}
                            </li>
                            <li>{t("applied_last_in_calculation")}</li>
                          </ul>
                        </li>
                        <li>
                          <strong className="text-gray-500">
                            {t("informational")}:
                          </strong>{" "}
                          {t("informational_explanation")}
                          <ul className="list-circle pl-5 mt-1 text-gray-600">
                            <li>{t("not_included_in_actual_calculation")}</li>
                            <li>{t("useful_for_reference_only")}</li>
                          </ul>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess && onSuccess(initialData?.id || "")}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <CareIcon icon="l-spinner" className="mr-2 animate-spin" />
                {t("saving")}
              </>
            ) : (
              t(isUpdate ? "update" : "create")
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
