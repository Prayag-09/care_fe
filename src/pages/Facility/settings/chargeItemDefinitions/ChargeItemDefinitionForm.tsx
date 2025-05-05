import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
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
import { Code, CodeSchema } from "@/types/questionnaire/code";

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
        {/* Visual Guide - Pricing Steps */}
        <div className="flex items-center justify-center mb-6 pt-2">
          <div className="flex items-center space-x-1 sm:space-x-3">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white"></div>
              <span className="text-xs mt-1 font-medium">Base Price</span>
            </div>
            <div className="h-px w-6 sm:w-12 bg-primary"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary"></div>
              <span className="text-xs mt-1">Discounts</span>
            </div>
            <div className="h-px w-6 sm:w-12 bg-primary/20"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <CareIcon icon="l-arrow-up" className="h-5 w-5" />
              </div>
              <span className="text-xs mt-1">Surcharges</span>
            </div>
            <div className="h-px w-6 sm:w-12 bg-primary/20"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary"></div>
              <span className="text-xs mt-1">Taxes</span>
            </div>
          </div>
        </div>

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

        {/* Pricing Section - Designed as a Bill */}
        <Card className="overflow-hidden shadow-md border-2 border-primary/10">
          <CardHeader className="bg-primary/5 border-b">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="bg-primary p-1.5 rounded text-white"></div>
                <CardTitle>{t("pricing_details")}</CardTitle>
              </div>
              <div className="bg-primary/10 px-3 py-1 rounded-full text-sm font-medium">
                {t("charge_definition")} #
                {isUpdate ? initialData?.id : t("new")}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Item Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm bg-primary/10">
                    <th className="py-4 px-4 text-left font-medium text-primary">
                      {t("price_component")}
                    </th>
                    <th className="py-4 px-4 text-left font-medium text-primary">
                      {t("type")}
                    </th>
                    <th className="py-4 px-4 text-right font-medium text-primary">
                      {t("value")}
                    </th>
                    <th className="py-4 px-4 text-right font-medium text-primary w-24">
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Base Price Row */}
                  <tr className="border-b bg-primary/5">
                    <td className="py-6 px-4">
                      <div className="font-medium text-primary flex items-center">
                        {t("base_price")}
                        <div className="ml-2 text-xs font-normal bg-primary/20 px-2 py-0.5 rounded-full text-primary/80">
                          Required
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        This is the starting price before any adjustments
                      </div>
                    </td>
                    <td className="py-6 px-4">
                      <Badge
                        variant="outline"
                        className="bg-primary/10 font-semibold"
                      >
                        {t("fixed_amount")}
                      </Badge>
                    </td>
                    <td className="py-6 px-4">
                      <div className="flex justify-end">
                        <div className="relative w-48">
                          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary font-bold">
                            ₹
                          </div>
                          <Input
                            id="base-price"
                            type="number"
                            value={basePrice?.amount ?? ""}
                            onChange={(e) => updateBasePrice(e.target.value)}
                            className="pl-7 text-right text-lg font-semibold bg-white focus:bg-white border-primary/30 focus-visible:ring-primary"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      {(!basePrice?.amount || basePrice.amount === null) && (
                        <div className="text-xs text-right text-red-500 mt-1 bg-red-50 p-1 rounded">
                          <CareIcon
                            icon="l-exclamation-circle"
                            className="h-3 w-3 mr-1 inline"
                          />
                          {t("base_price_requires_amount")}
                        </div>
                      )}
                    </td>
                    <td className="py-6 px-4"></td>
                  </tr>

                  {/* Discount Section Header */}
                  <tr className="border-b bg-green-50">
                    <td colSpan={4} className="py-3 px-4">
                      <div className="flex items-center text-green-800 font-medium">
                        {t("available_discounts")}
                      </div>
                    </td>
                  </tr>

                  {/* Discount Codes Rows */}
                  {discountCodes.length === 0 ? (
                    <tr className="border-b">
                      <td colSpan={4} className="py-6 px-4 text-sm text-center">
                        <div className="flex flex-col items-center p-4 bg-muted/10 rounded-md">
                          <p className="text-muted-foreground">
                            {t("no_discount_codes_available")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Configure discount codes in facility settings
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    discountCodes.map((code) => {
                      const isSelected = isCodeSelected(
                        code,
                        MonetoryComponentType.discount,
                      );
                      return (
                        <tr
                          key={`discount-${code.system}-${code.code}`}
                          className={`border-b ${isSelected ? "bg-white hover:bg-green-50/50" : "bg-muted/10 hover:bg-green-50/20"} transition-colors`}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={`discount-${code.code}`}
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  toggleDiscountCode(code, checked === true)
                                }
                                className="h-5 w-5 border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:text-white"
                              />
                              <div>
                                <label
                                  htmlFor={`discount-${code.code}`}
                                  className="cursor-pointer font-medium"
                                >
                                  {code.display}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  {code.code}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-700 border-green-200"
                            >
                              {t("discount")}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            {isSelected ? (
                              <div className="flex justify-end">
                                <div className="relative w-40">
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
                                    className="pr-7 text-right border-green-300 focus-visible:ring-green-500 text-green-700 font-medium"
                                  />
                                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-700">
                                    %
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-right text-muted-foreground">
                                -
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {isSelected && (
                              <div className="flex justify-end">
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                  Applied
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Tax Section Header */}
                  <tr className="border-b bg-blue-50">
                    <td colSpan={4} className="py-3 px-4">
                      <div className="flex items-center text-blue-800 font-medium">
                        {t("applicable_taxes")}
                      </div>
                    </td>
                  </tr>

                  {/* Tax Codes Rows */}
                  {taxCodes.length === 0 ? (
                    <tr className="border-b">
                      <td colSpan={4} className="py-6 px-4 text-sm text-center">
                        <div className="flex flex-col items-center p-4 bg-muted/10 rounded-md">
                          <p className="text-muted-foreground">
                            {t("no_tax_codes_available")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Configure tax codes in facility settings
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    taxCodes.map((code) => {
                      const isSelected = isCodeSelected(
                        code,
                        MonetoryComponentType.tax,
                      );
                      return (
                        <tr
                          key={`tax-${code.system}-${code.code}`}
                          className={`border-b ${isSelected ? "bg-white hover:bg-blue-50/50" : "bg-muted/10 hover:bg-blue-50/20"} transition-colors`}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={`tax-${code.code}`}
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  toggleTaxCode(code, checked === true)
                                }
                                className="h-5 w-5 border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white"
                              />
                              <div>
                                <label
                                  htmlFor={`tax-${code.code}`}
                                  className="cursor-pointer font-medium"
                                >
                                  {code.display}
                                </label>
                                <p className="text-xs text-muted-foreground">
                                  {code.code}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              variant="outline"
                              className="bg-blue-100 text-blue-700 border-blue-200"
                            >
                              {t("tax")}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            {isSelected ? (
                              <div className="flex justify-end">
                                <div className="relative w-40">
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
                                    className="pr-7 text-right border-blue-300 focus-visible:ring-blue-500 text-blue-700 font-medium"
                                  />
                                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-700">
                                    %
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-right text-muted-foreground">
                                -
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {isSelected && (
                              <div className="flex justify-end">
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                  Applied
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Surcharge Section Header */}
                  <tr className="border-b bg-orange-50">
                    <td colSpan={4} className="py-3 px-4">
                      <div className="flex items-center text-orange-800 font-medium">
                        <CareIcon
                          icon="l-arrow-up"
                          className="h-5 w-5 mr-2 text-orange-600"
                        />
                        {t("custom_surcharges")}
                      </div>
                    </td>
                  </tr>

                  {/* Surcharges Rows */}
                  {surcharges.length === 0 ? (
                    <tr className="border-b">
                      <td colSpan={4} className="py-6 px-4 text-sm text-center">
                        <div className="flex flex-col items-center p-6 bg-muted/5 rounded-md">
                          <CareIcon
                            icon="l-plus-circle"
                            className="h-8 w-8 text-orange-300 mb-2"
                          />
                          <p className="text-muted-foreground">
                            {t("no_surcharges_yet")}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Use the "Add Surcharge" button below to add fixed
                            amounts or percentages
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addSurcharge}
                            className="mt-4 border-orange-300 text-orange-700 hover:bg-orange-100"
                          >
                            <CareIcon icon="l-plus" className="mr-2 h-4 w-4" />
                            {t("add_first_surcharge")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    surcharges.map((surcharge, index) => {
                      const componentIndex = priceComponents.indexOf(surcharge);
                      return (
                        <tr
                          key={`surcharge-${index}`}
                          className="border-b bg-white hover:bg-orange-50/20 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="font-medium flex items-center">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 mr-2 text-xs font-bold">
                                {index + 1}
                              </div>
                              {t("surcharge")} #{index + 1}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 ml-8">
                              {surcharge.use_factor
                                ? "Percentage-based surcharge"
                                : "Fixed amount surcharge"}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              variant="outline"
                              className="bg-orange-100 text-orange-700 border-orange-200"
                            >
                              {surcharge.use_factor
                                ? t("percentage")
                                : t("fixed_amount")}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex justify-end">
                              <div className="relative w-40">
                                {surcharge.use_factor ? (
                                  <>
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
                                      className="pr-7 text-right border-orange-300 focus-visible:ring-orange-500 text-orange-700 font-medium"
                                    />
                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-700">
                                      %
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-700 font-bold">
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
                                      className="pl-7 text-right border-orange-300 focus-visible:ring-orange-500 text-orange-700 font-medium"
                                    />
                                  </>
                                )}
                              </div>
                            </div>
                            {(surcharge.use_factor
                              ? !surcharge.factor
                              : !surcharge.amount) && (
                              <div className="text-xs text-right text-red-500 mt-1 bg-red-50 p-1 rounded">
                                <CareIcon
                                  icon="l-exclamation-circle"
                                  className="h-3 w-3 mr-1 inline"
                                />
                                {surcharge.use_factor
                                  ? t("percentage_required")
                                  : t("amount_required")}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end space-x-1">
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
                                <SelectTrigger className="w-24 h-8 border-orange-300 focus:ring-orange-500 focus-visible:ring-orange-500">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="amount">
                                    <span className="font-medium flex items-center">
                                      <span className="mr-1">₹</span>{" "}
                                      {t("amount")}
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="percentage">
                                    <span className="font-medium flex items-center">
                                      <span className="mr-1">%</span>{" "}
                                      {t("percentage")}
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>

                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-red-100 hover:text-red-700 transition-colors"
                                onClick={() => removeSurcharge(componentIndex)}
                                title={t("delete")}
                              >
                                <CareIcon
                                  icon="l-trash"
                                  className="h-4 w-4 text-red-500"
                                />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Add Surcharge Button */}
            <div className="p-6 border-t bg-primary/5">
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={addSurcharge}
                className="w-full bg-white hover:bg-primary hover:text-white transition-colors group border-primary/30 text-primary"
              >
                <CareIcon
                  icon="l-plus"
                  className="mr-2 h-5 w-5 group-hover:animate-pulse"
                />
                {t("add_surcharge")}
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-2">
                Add fixed amounts or percentages to the base price
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Price Summary Card */}
        <Card className="shadow-md border-2 border-green-100">
          <CardHeader className="bg-green-50 border-b">
            <div className="flex items-center gap-2">
              <div className="bg-green-600 p-1.5 rounded text-white">
                <CareIcon icon="l-calculator" className="h-5 w-5" />
              </div>
              <CardTitle>{t("price_summary")}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="flex flex-col space-y-2">
              {/* Base Price */}
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">{t("base_price")}</span>
                <span>
                  {basePrice?.amount
                    ? `₹${basePrice.amount.toFixed(2)}`
                    : "₹0.00"}
                </span>
              </div>

              {/* Surcharges */}
              {surcharges.length > 0 && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">
                    {t("surcharges")}
                  </span>
                  <span>
                    {surcharges
                      .map((s) => {
                        if (s.use_factor) {
                          return `+${((s.factor || 0) * 100).toFixed(0)}%`;
                        } else {
                          return `+₹${(s.amount || 0).toFixed(2)}`;
                        }
                      })
                      .join(", ")}
                  </span>
                </div>
              )}

              {/* Discounts */}
              {discountCodes.some((code) =>
                isCodeSelected(code, MonetoryComponentType.discount),
              ) && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">
                    {t("discounts")}
                  </span>
                  <span>
                    {discountCodes
                      .filter((code) =>
                        isCodeSelected(code, MonetoryComponentType.discount),
                      )
                      .map(
                        (code) =>
                          `-${getComponentPercentage(code, MonetoryComponentType.discount)}%`,
                      )
                      .join(", ")}
                  </span>
                </div>
              )}

              {/* Taxes */}
              {taxCodes.some((code) =>
                isCodeSelected(code, MonetoryComponentType.tax),
              ) && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">{t("taxes")}</span>
                  <span>
                    {taxCodes
                      .filter((code) =>
                        isCodeSelected(code, MonetoryComponentType.tax),
                      )
                      .map(
                        (code) =>
                          `+${getComponentPercentage(code, MonetoryComponentType.tax)}%`,
                      )
                      .join(", ")}
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="flex justify-between pt-4 mt-2 font-bold border-t-2 border-green-200">
                <span className="text-green-700">{t("estimated_total")}</span>
                <span className="text-xl text-green-700 tabular-nums">
                  {/* This is just an estimate since actual calculation depends on implementation */}
                  ₹{basePrice?.amount ? basePrice.amount.toFixed(2) : "0.00"}
                </span>
              </div>
              <div className="flex items-center mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200 text-sm text-yellow-700">
                <CareIcon
                  icon="l-info-circle"
                  className="h-5 w-5 mr-2 text-yellow-500"
                />
                {t("final_price_depends_on_actual_implementation")}
              </div>
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
        <div className="sticky bottom-0 bg-white p-4 mt-8 border-t flex justify-between items-center shadow-md rounded-b-md z-10">
          <div className="text-sm">
            <span className="text-muted-foreground">
              {t("all_fields_saved_automatically")}
            </span>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onSuccess?.()}
              className="border-gray-300 hover:bg-gray-100 hover:text-gray-900"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary hover:bg-primary/90 text-white px-8 gap-2 shadow-md"
            >
              {isPending ? (
                <>
                  <CareIcon icon="l-spinner" className="animate-spin" />
                  <span>{t("saving")}</span>
                </>
              ) : (
                <>
                  <CareIcon icon="l-check" />
                  <span>{t(isUpdate ? "update" : "create")}</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
