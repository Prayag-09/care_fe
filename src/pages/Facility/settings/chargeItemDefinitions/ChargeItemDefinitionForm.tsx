import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
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
import facilityApi from "@/types/facility/facilityApi";
import { Code } from "@/types/questionnaire/code";

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
    use_factor: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.monetory_component_type === MonetoryComponentType.base) {
        // Base price must have amount, not factor
        return data.amount !== undefined && data.amount !== null;
      } else {
        // Other types need either amount or factor based on use_factor toggle
        return data.use_factor
          ? data.factor !== undefined && data.factor !== null
          : data.amount !== undefined && data.amount !== null;
      }
    },
    {
      message:
        "Base price requires an amount. Other types need either amount or factor.",
      path: ["amount"],
    },
  );

const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  status: z.nativeEnum(ChargeItemDefinitionStatus),
  description: z.string().nullable(),
  purpose: z.string().nullable(),
  derived_from_uri: z.string().nullable(),
  price_component: z.array(priceComponentSchema).refine(
    (components) => {
      // Ensure there is at least one component and the first one is base price
      return (
        components.length > 0 &&
        components[0].monetory_component_type === MonetoryComponentType.base
      );
    },
    {
      message: "At least one base price component is required",
    },
  ),
});

// Define extended form schema type
type FormValues = z.infer<typeof formSchema>;

interface ChargeItemDefinitionFormProps {
  facilityId: string;
  initialData?: ChargeItemDefinitionRead;
  isUpdate?: boolean;
  onSuccess?: () => void;
}

export function ChargeItemDefinitionForm({
  facilityId,
  initialData,
  isUpdate = false,
  onSuccess = () =>
    navigate(`/facility/${facilityId}/settings/charge_item_definitions`),
}: ChargeItemDefinitionFormProps) {
  const { t } = useTranslation();

  // Initialize price components with base price
  const getInitialPriceComponents = () => {
    if (
      initialData?.price_component &&
      initialData.price_component.length > 0
    ) {
      return initialData.price_component.map((comp) => ({
        ...comp,
        use_factor: comp.factor !== null && comp.factor !== undefined,
      }));
    } else {
      return [
        {
          monetory_component_type: MonetoryComponentType.base,
          amount: 0,
          factor: null,
          code: null,
          use_factor: false,
        },
      ];
    }
  };

  const [priceComponents, setPriceComponents] = useState<
    (MonetoryComponent & { use_factor?: boolean })[]
  >(getInitialPriceComponents());

  // Fetch facility data for discount and tax codes
  const { data: facilityData, isLoading: isFacilityLoading } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.getFacility, {
      pathParams: { id: facilityId },
    }),
  });

  // Log facility data when loaded (for debugging)
  useEffect(() => {
    if (facilityData) {
      console.log("Facility discount codes:", facilityData.discount_codes);
      console.log(
        "Facility instance discount codes:",
        facilityData.instance_discount_codes,
      );
      console.log(
        "Facility instance tax codes:",
        facilityData.instance_tax_codes,
      );
    }
  }, [facilityData]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialData,
      price_component: getInitialPriceComponents(),
      title: initialData?.title || "",
      status: initialData?.status || ChargeItemDefinitionStatus.draft,
      description: initialData?.description || null,
      purpose: initialData?.purpose || null,
      derived_from_uri: initialData?.derived_from_uri || null,
    },
  });

  // Watch form values
  const watchedValues = useWatch({
    control: form.control,
  });

  // Update price components when form values change
  useEffect(() => {
    if (
      watchedValues.price_component &&
      watchedValues.price_component.length > 0
    ) {
      setPriceComponents(
        watchedValues.price_component as (MonetoryComponent & {
          use_factor?: boolean;
        })[],
      );
    }
  }, [watchedValues.price_component]);

  // Form submission handler
  const {
    mutate: submitForm,
    isPending,
    error,
  } = useMutation({
    mutationFn: (data: FormValues) => {
      // Prepare the final submission data
      const cleanedPriceComponents = data.price_component.map((comp) => {
        // Remove UI-only fields
        const { use_factor, ...componentData } = comp;

        // For base price type, ensure we only use amount (not factor)
        if (
          componentData.monetory_component_type === MonetoryComponentType.base
        ) {
          return {
            monetory_component_type: componentData.monetory_component_type,
            amount: componentData.amount,
            ...(componentData.code && { code: componentData.code }),
          };
        }

        // For other types, use either amount or factor based on selection
        return {
          monetory_component_type: componentData.monetory_component_type,
          ...(componentData.code && { code: componentData.code }),
          ...(use_factor
            ? { factor: componentData.factor }
            : { amount: componentData.amount }),
        };
      });

      const submissionData: ChargeItemDefinitionCreate = {
        ...data,
        price_component: cleanedPriceComponents,
        slug: data.title.toLowerCase().replace(/\s+/g, "-"),
      };

      if (isUpdate && initialData) {
        return mutate(chargeItemDefinitionApi.updateChargeItemDefinition, {
          pathParams: { facilityId, chargeItemDefinitionId: initialData.id },
        })(submissionData);
      } else {
        return mutate(chargeItemDefinitionApi.createChargeItemDefinition, {
          pathParams: { facilityId },
        })(submissionData);
      }
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (err) => {
      console.error("Mutation error:", err);
    },
  });

  const onSubmit = (values: FormValues) => {
    submitForm(values);
  };

  const handleSubmit = form.handleSubmit(onSubmit);

  // Helper function to get available codes for a component type
  const getAvailableCodesForType = (type: MonetoryComponentType): Code[] => {
    if (!facilityData) return [];

    switch (type) {
      case MonetoryComponentType.discount:
        return [
          ...(facilityData.discount_codes || []),
          ...(facilityData.instance_discount_codes || []),
        ];
      case MonetoryComponentType.tax:
        return [...(facilityData.instance_tax_codes || [])];
      default:
        return [];
    }
  };

  // Get all available discount codes
  const discountCodes = getAvailableCodesForType(
    MonetoryComponentType.discount,
  );

  // Get all available tax codes
  const taxCodes = getAvailableCodesForType(MonetoryComponentType.tax);

  // Update base price
  const updateBasePrice = (value: string) => {
    const amount = value === "" ? null : parseFloat(value);

    // Find the base price component (should be first)
    const baseComponent = priceComponents.find(
      (c) => c.monetory_component_type === MonetoryComponentType.base,
    );

    if (baseComponent) {
      const updatedComponents = [...priceComponents];
      const index = priceComponents.indexOf(baseComponent);

      updatedComponents[index] = {
        ...baseComponent,
        amount,
      };

      setPriceComponents(updatedComponents);
      form.setValue("price_component", updatedComponents, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  };

  // Add or remove a discount code
  const toggleDiscountCode = (codeObj: Code, isChecked: boolean) => {
    const existingComponent = priceComponents.find(
      (c) =>
        c.monetory_component_type === MonetoryComponentType.discount &&
        c.code?.code === codeObj.code &&
        c.code?.system === codeObj.system,
    );

    if (isChecked && !existingComponent) {
      // Add a new discount component
      const newComponent: MonetoryComponent & { use_factor?: boolean } = {
        monetory_component_type: MonetoryComponentType.discount,
        code: codeObj,
        amount: null,
        factor: 0.1, // Default 10% discount
        use_factor: true,
      };

      const updatedComponents = [...priceComponents, newComponent];
      setPriceComponents(updatedComponents);
      form.setValue("price_component", updatedComponents, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    } else if (!isChecked && existingComponent) {
      // Remove the discount component
      const updatedComponents = priceComponents.filter(
        (c) =>
          !(
            c.monetory_component_type === MonetoryComponentType.discount &&
            c.code?.code === codeObj.code &&
            c.code?.system === codeObj.system
          ),
      );

      setPriceComponents(updatedComponents);
      form.setValue("price_component", updatedComponents, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  };

  // Add or remove a tax code
  const toggleTaxCode = (codeObj: Code, isChecked: boolean) => {
    const existingComponent = priceComponents.find(
      (c) =>
        c.monetory_component_type === MonetoryComponentType.tax &&
        c.code?.code === codeObj.code &&
        c.code?.system === codeObj.system,
    );

    if (isChecked && !existingComponent) {
      // Add a new tax component
      const newComponent: MonetoryComponent & { use_factor?: boolean } = {
        monetory_component_type: MonetoryComponentType.tax,
        code: codeObj,
        amount: null,
        factor: 0.18, // Default 18% tax (like GST)
        use_factor: true,
      };

      const updatedComponents = [...priceComponents, newComponent];
      setPriceComponents(updatedComponents);
      form.setValue("price_component", updatedComponents, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    } else if (!isChecked && existingComponent) {
      // Remove the tax component
      const updatedComponents = priceComponents.filter(
        (c) =>
          !(
            c.monetory_component_type === MonetoryComponentType.tax &&
            c.code?.code === codeObj.code &&
            c.code?.system === codeObj.system
          ),
      );

      setPriceComponents(updatedComponents);
      form.setValue("price_component", updatedComponents, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  };

  // Add a custom surcharge
  const addSurcharge = () => {
    const newComponent: MonetoryComponent & { use_factor?: boolean } = {
      monetory_component_type: MonetoryComponentType.surcharge,
      amount: 0,
      factor: null,
      code: null,
      use_factor: false,
    };

    const updatedComponents = [...priceComponents, newComponent];
    setPriceComponents(updatedComponents);
    form.setValue("price_component", updatedComponents, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  // Update a surcharge
  const updateSurcharge = (
    index: number,
    field: "amount" | "factor" | "use_factor",
    value: any,
  ) => {
    const updatedComponents = [...priceComponents];

    if (field === "use_factor") {
      updatedComponents[index].use_factor = value;

      // Initialize the appropriate field
      if (value && updatedComponents[index].factor === null) {
        updatedComponents[index].factor = 0;
      } else if (!value && updatedComponents[index].amount === null) {
        updatedComponents[index].amount = 0;
      }
    } else if (field === "amount") {
      updatedComponents[index].amount = value === "" ? null : parseFloat(value);
    } else if (field === "factor") {
      const percentValue = value === "" ? null : parseFloat(value);
      updatedComponents[index].factor =
        percentValue !== null ? percentValue / 100 : null;
    }

    setPriceComponents(updatedComponents);
    form.setValue("price_component", updatedComponents, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  // Remove a surcharge
  const removeSurcharge = (index: number) => {
    const updatedComponents = [...priceComponents];
    updatedComponents.splice(index, 1);

    setPriceComponents(updatedComponents);
    form.setValue("price_component", updatedComponents, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  // Check if a specific code is selected
  const isCodeSelected = (
    codeObj: Code,
    type: MonetoryComponentType,
  ): boolean => {
    return priceComponents.some(
      (c) =>
        c.monetory_component_type === type &&
        c.code?.code === codeObj.code &&
        c.code?.system === codeObj.system,
    );
  };

  // Get factor (percentage) value for a component
  const getComponentPercentage = (
    codeObj: Code,
    type: MonetoryComponentType,
  ): number => {
    const component = priceComponents.find(
      (c) =>
        c.monetory_component_type === type &&
        c.code?.code === codeObj.code &&
        c.code?.system === codeObj.system,
    );

    return component?.factor ? component.factor * 100 : 0;
  };

  // Get surcharges
  const surcharges = priceComponents.filter(
    (c) => c.monetory_component_type === MonetoryComponentType.surcharge,
  );

  // Get base price component
  const basePrice = priceComponents.find(
    (c) => c.monetory_component_type === MonetoryComponentType.base,
  );

  // Add a function to update the percentage for a discount or tax code
  const updateComponentPercentage = (
    codeObj: Code,
    type: MonetoryComponentType,
    value: string,
  ) => {
    const component = priceComponents.find(
      (c) =>
        c.monetory_component_type === type &&
        c.code?.code === codeObj.code &&
        c.code?.system === codeObj.system,
    );

    if (component) {
      const updatedComponents = [...priceComponents];
      const index = priceComponents.indexOf(component);
      const percentValue = value === "" ? null : parseFloat(value);

      updatedComponents[index] = {
        ...component,
        factor: percentValue !== null ? percentValue / 100 : null,
        use_factor: true,
      };

      setPriceComponents(updatedComponents);
      form.setValue("price_component", updatedComponents, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  };

  // Show loading state while fetching facility data
  if (isFacilityLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CareIcon icon="l-spinner" className="animate-spin mr-2" />
        <span>{t("loading_facility_data")}</span>
      </div>
    );
  }

  return (
    <Form {...form}>
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500">
          {error.message || "An error occurred while saving the form"}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
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
            </div>
          </CardContent>
        </Card>

        {/* Pricing Section */}
        <Card>
          <CardHeader>
            <CardTitle>{t("pricing_details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Base Price Section */}
            <div className="bg-white rounded-md border p-4 space-y-2">
              <h3 className="text-lg font-medium">{t("base_price")}</h3>
              <div className="flex items-end gap-2">
                <div className="flex-1 max-w-md">
                  <Label htmlFor="base-price">{t("amount")}</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ₹
                    </span>
                    <Input
                      id="base-price"
                      type="number"
                      value={basePrice?.amount ?? ""}
                      onChange={(e) => updateBasePrice(e.target.value)}
                      className="pl-7"
                      placeholder="0.00"
                    />
                  </div>
                  {(!basePrice?.amount || basePrice.amount === null) && (
                    <p className="text-xs text-red-500 mt-1">
                      {t("base_price_requires_amount")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Discount Codes Section */}
              <div className="bg-white rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{t("discounts")}</h3>
                </div>

                {discountCodes.length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-2">
                    {t("no_discount_codes_available")}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {discountCodes.map((code) => (
                      <div
                        key={`${code.system}|${code.code}`}
                        className="flex items-center justify-between border-b pb-2"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`discount-${code.code}`}
                            checked={isCodeSelected(
                              code,
                              MonetoryComponentType.discount,
                            )}
                            onCheckedChange={(checked) =>
                              toggleDiscountCode(code, checked === true)
                            }
                          />
                          <div>
                            <label
                              htmlFor={`discount-${code.code}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {code.display} -{" "}
                              {getComponentPercentage(
                                code,
                                MonetoryComponentType.discount,
                              )}
                              %
                            </label>
                            <p className="text-xs text-gray-500">{code.code}</p>
                          </div>
                        </div>

                        {isCodeSelected(
                          code,
                          MonetoryComponentType.discount,
                        ) && (
                          <div className="relative w-24">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={getComponentPercentage(
                                code,
                                MonetoryComponentType.discount,
                              )}
                              onChange={(e) =>
                                updateComponentPercentage(
                                  code,
                                  MonetoryComponentType.discount,
                                  e.target.value,
                                )
                              }
                              className="pr-7 h-8 text-right"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                              %
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tax Codes Section */}
              <div className="bg-white rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{t("taxes")}</h3>
                </div>

                {taxCodes.length === 0 ? (
                  <div className="text-sm text-gray-500 italic p-2">
                    {t("no_tax_codes_available")}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {taxCodes.map((code) => (
                      <div
                        key={`${code.system}|${code.code}`}
                        className="flex items-center justify-between border-b pb-2"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`tax-${code.code}`}
                            checked={isCodeSelected(
                              code,
                              MonetoryComponentType.tax,
                            )}
                            onCheckedChange={(checked) =>
                              toggleTaxCode(code, checked === true)
                            }
                          />
                          <div>
                            <label
                              htmlFor={`tax-${code.code}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {code.display}
                            </label>
                            <p className="text-xs text-gray-500">{code.code}</p>
                          </div>
                        </div>

                        {isCodeSelected(code, MonetoryComponentType.tax) && (
                          <div className="relative w-24">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={getComponentPercentage(
                                code,
                                MonetoryComponentType.tax,
                              )}
                              onChange={(e) =>
                                updateComponentPercentage(
                                  code,
                                  MonetoryComponentType.tax,
                                  e.target.value,
                                )
                              }
                              className="pr-7 h-8 text-right"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                              %
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Surcharges Section */}
            <div className="bg-white rounded-md border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{t("surcharges")}</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSurcharge}
                >
                  <CareIcon icon="l-plus" className="mr-1 h-4 w-4" /> {t("add")}
                </Button>
              </div>

              {surcharges.length === 0 ? (
                <div className="text-sm text-gray-500 italic p-2">
                  {t("no_surcharges")}
                </div>
              ) : (
                <div className="space-y-3">
                  {surcharges.map((surcharge, index) => {
                    const componentIndex = priceComponents.indexOf(surcharge);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between border rounded-md p-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-32">
                              <Select
                                value={
                                  surcharge.use_factor ? "percentage" : "amount"
                                }
                                onValueChange={(value) =>
                                  updateSurcharge(
                                    componentIndex,
                                    "use_factor",
                                    value === "percentage",
                                  )
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="amount">
                                    <span className="font-medium">
                                      ₹ {t("amount")}
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="percentage">
                                    <span className="font-medium">
                                      % {t("percentage")}
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {surcharge.use_factor ? (
                              <div className="relative flex-1">
                                <Input
                                  type="number"
                                  value={
                                    surcharge.factor !== null &&
                                    surcharge.factor !== undefined
                                      ? surcharge.factor * 100
                                      : ""
                                  }
                                  onChange={(e) =>
                                    updateSurcharge(
                                      componentIndex,
                                      "factor",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="0.00"
                                  className="pr-7"
                                />
                                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                  %
                                </span>
                              </div>
                            ) : (
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                  ₹
                                </span>
                                <Input
                                  type="number"
                                  value={surcharge.amount ?? ""}
                                  onChange={(e) =>
                                    updateSurcharge(
                                      componentIndex,
                                      "amount",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="0.00"
                                  className="pl-7"
                                />
                              </div>
                            )}

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSurcharge(componentIndex)}
                              title={t("delete")}
                            >
                              <CareIcon
                                icon="l-trash"
                                className="h-4 w-4 text-red-500"
                              />
                            </Button>
                          </div>

                          {/* Validation error */}
                          {(surcharge.use_factor
                            ? !surcharge.factor
                            : !surcharge.amount) && (
                            <p className="text-xs text-red-500 mt-1">
                              {surcharge.use_factor
                                ? t("percentage_required")
                                : t("amount_required")}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Details Section */}
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
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    {t("description_help_text")}
                  </FormDescription>
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
                      rows={3}
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

        {/* Action buttons */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
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
