import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, X } from "lucide-react";
import { navigate } from "raviger";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
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

import Page from "@/components/Common/Page";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { generateSlug } from "@/Utils/utils";
import { Code } from "@/types/base/code/code";
import { DOSAGE_UNITS_CODES } from "@/types/emr/medicationRequest/medicationRequest";
import {
  ProductKnowledgeBase,
  ProductKnowledgeCreate,
  ProductKnowledgeStatus,
  ProductKnowledgeType,
  ProductKnowledgeUpdate,
  ProductNameTypes,
} from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";

// Define a Code schema to match the API type
const codeSchema = z.object({
  code: z.string().min(1, "Code is required"),
  display: z.string().min(1, "Display name is required"),
  system: z.string().min(1, "System is required"),
});

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  product_type: z.nativeEnum(ProductKnowledgeType),
  status: z.nativeEnum(ProductKnowledgeStatus),
  code: codeSchema.nullable(),
  names: z
    .array(
      z.object({
        name_type: z.nativeEnum(ProductNameTypes),
        name: z.string().min(1, "Name is required"),
      }),
    )
    .default([]),
  storage_guidelines: z
    .array(
      z.object({
        note: z.string().min(1, "Note is required"),
        stability_duration: z
          .object({
            value: z.number().int().optional(),
            unit: codeSchema,
          })
          .refine((data) => data.value !== undefined && data.value !== null),
      }),
    )
    .default([]),
  definitional: z
    .object({
      dosage_form: codeSchema.optional(),
      intended_routes: z.array(codeSchema).default([]),
    })
    .nullable()
    .optional()
    .refine((data) => {
      if (!data) return true; // definitional is optional
      return data.dosage_form && data.dosage_form.code; // if definitional exists, dosage_form is required
    }),
});

export default function ProductKnowledgeForm({
  facilityId,
  productKnowledgeId,
  onSuccess,
}: {
  facilityId: string;
  productKnowledgeId?: string;
  onSuccess?: () => void;
}) {
  const { t } = useTranslation();

  const isEditMode = Boolean(productKnowledgeId);

  const { data: existingData, isFetching } = useQuery({
    queryKey: ["productKnowledge", productKnowledgeId],
    queryFn: query(productKnowledgeApi.retrieveProductKnowledge, {
      pathParams: { productKnowledgeId: productKnowledgeId! },
    }),
    enabled: isEditMode,
  });

  if (isEditMode && isFetching) {
    return (
      <Page title={t("edit_product_knowledge")} hideTitleOnPage>
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("edit_product_knowledge")}
            </h1>
          </div>
          <FormSkeleton rows={10} />
        </div>
      </Page>
    );
  }

  return (
    <ProductKnowledgeFormContent
      facilityId={facilityId}
      productKnowledgeId={productKnowledgeId}
      existingData={existingData}
      onSuccess={onSuccess}
    />
  );
}

function ProductKnowledgeFormContent({
  facilityId,
  productKnowledgeId,
  existingData,
  onSuccess = () =>
    navigate(`/facility/${facilityId}/settings/product_knowledge`),
}: {
  facilityId: string;
  productKnowledgeId?: string;
  existingData?: ProductKnowledgeBase;
  onSuccess?: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(productKnowledgeId);

  // Create default storage guidelines and units
  const defaultUnitCode: Code = {
    code: "d",
    display: "Day",
    system: "http://unitsofmeasure.org",
  };

  // Handle form initialization with proper mapping of types
  const getDefaultValues = () => {
    if (isEditMode && existingData) {
      return {
        name: existingData.name,
        slug: existingData.slug,
        product_type: existingData.product_type,
        status: existingData.status,
        code: existingData.code?.code ? existingData.code : null,
        names: existingData.names || [],
        storage_guidelines: existingData.storage_guidelines || [],
        definitional:
          existingData.definitional &&
          Object.keys(existingData.definitional).length > 0
            ? existingData.definitional
            : null,
      };
    }

    return {
      product_type: ProductKnowledgeType.medication,
      names: [],
      storage_guidelines: [],
      code: null,
      definitional: null,
      status: ProductKnowledgeStatus.active,
    };
  };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  React.useEffect(() => {
    if (isEditMode) return;

    const subscription = form.watch((value, { name }) => {
      if (name === "name") {
        form.setValue("slug", generateSlug(value.name || ""), {
          shouldValidate: true,
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, isEditMode]);

  const namesArray = useFieldArray({
    control: form.control,
    name: "names",
  });

  const storageGuidelinesArray = useFieldArray({
    control: form.control,
    name: "storage_guidelines",
  });

  const intendedRoutesArray = useFieldArray({
    control: form.control,
    name: "definitional.intended_routes",
  });

  const { mutate: createProductKnowledge, isPending: isCreating } = useMutation(
    {
      mutationFn: mutate(productKnowledgeApi.createProductKnowledge),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["productKnowledge"] });
        toast.success(t("product_knowledge_created_successfully"));
        onSuccess();
      },
    },
  );

  const { mutate: updateProductKnowledge, isPending: isUpdating } = useMutation(
    {
      mutationFn: mutate(productKnowledgeApi.updateProductKnowledge, {
        pathParams: {
          productKnowledgeId: productKnowledgeId || "",
        },
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["productKnowledge"] });
        queryClient.invalidateQueries({
          queryKey: ["productKnowledge", productKnowledgeId],
        });
        toast.success(t("product_knowledge_updated_successfully"));
        navigate(`/facility/${facilityId}/settings/product_knowledge`);
      },
    },
  );

  const isPending = isCreating || isUpdating;

  function onSubmit(data: z.infer<typeof formSchema>) {
    // Convert null to undefined where needed to match API types
    const formattedData = {
      ...data,
      code: data.code || undefined,
      definitional: data.definitional
        ? {
            ...data.definitional,
            ingredients: [],
            nutrients: [],
            drug_characteristic: [],
          }
        : undefined,
    };

    if (isEditMode && productKnowledgeId) {
      const updatePayload = {
        ...formattedData,
        id: productKnowledgeId,
        facility: facilityId,
      };
      updateProductKnowledge(updatePayload as ProductKnowledgeUpdate);
    } else {
      const payload = {
        ...formattedData,
        facility: facilityId,
      };
      createProductKnowledge(payload as ProductKnowledgeCreate);
    }
  }

  return (
    <Page
      title={
        isEditMode ? t("edit_product_knowledge") : t("create_product_knowledge")
      }
      hideTitleOnPage
    >
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditMode
              ? t("edit_product_knowledge")
              : t("create_product_knowledge")}
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Information Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-medium text-gray-900">
                    {t("basic_information")}
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {t("PKF_basic_information_description")}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel aria-required>{t("name")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel aria-required>{t("slug")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => {
                              const sanitizedValue = e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9-]/g, "");
                              field.onChange(sanitizedValue);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("slug_format_message")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="product_type"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("product_type")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("select_product_type")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(ProductKnowledgeType).map((type) => (
                              <SelectItem key={type} value={type}>
                                {t(type)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <FormLabel>{t("code")}</FormLabel>
                    <div className="mt-2">
                      <ValueSetSelect
                        system="system-medication"
                        value={form.watch("code")}
                        placeholder={t("search_for_product_codes")}
                        onSelect={(code) => {
                          form.setValue("code", {
                            code: code.code,
                            display: code.display,
                            system: code.system,
                          });
                        }}
                        showCode={true}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>{t("status")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("status")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(ProductKnowledgeStatus).map(
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
              </div>
            </div>

            {/* Alternative Names Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-medium text-gray-900">
                      {t("alternative_names")}
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {t("add_product_alternative name")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      namesArray.append({
                        name_type: ProductNameTypes.trade_name,
                        name: "",
                      });
                    }}
                  >
                    <PlusCircle className="mr-2 size-4" />
                    {t("add_name")}
                  </Button>
                </div>

                {namesArray.fields.length > 0 ? (
                  <div className="space-y-4">
                    {namesArray.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-end gap-2 rounded-md border p-3"
                      >
                        <div className="flex-1 space-y-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name={`names.${index}.name_type`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel>{t("name_type")}</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue
                                          placeholder={t("select_name_type")}
                                        />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Object.values(ProductNameTypes).map(
                                        (type) => (
                                          <SelectItem key={type} value={type}>
                                            {t(type)}
                                          </SelectItem>
                                        ),
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`names.${index}.name`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel aria-required>
                                    {t("name")}
                                  </FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => namesArray.remove(index)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md bg-gray-50 p-4 text-center text-sm text-gray-500">
                    {t("no_alternative_names_added")}
                  </div>
                )}
              </div>
            </div>

            {/* Storage Guidelines Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-medium text-gray-900">
                      {t("storage_guidelines")}
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {t("PKF_storage_guidelines_description")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      storageGuidelinesArray.append({
                        note: "",
                        stability_duration: {
                          value: undefined,
                          unit: defaultUnitCode,
                        },
                      });
                    }}
                  >
                    <PlusCircle className="mr-2 size-4" />
                    {t("add_guideline")}
                  </Button>
                </div>

                {storageGuidelinesArray.fields.length > 0 ? (
                  <div className="space-y-4">
                    {storageGuidelinesArray.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-start gap-2 rounded-md border p-3"
                      >
                        <div className="flex-1 space-y-3">
                          <FormField
                            control={form.control}
                            name={`storage_guidelines.${index}.note`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel aria-required>{t("note")}</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    className="min-h-[60px]"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid gap-3 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name={`storage_guidelines.${index}.stability_duration.value`}
                              render={({ field }) => (
                                <FormItem className="flex flex-col">
                                  <FormLabel aria-required>
                                    {t("duration_value")}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      pattern="[0-9]*"
                                      type="number"
                                      value={field.value ?? ""}
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value
                                            ? parseInt(e.target.value)
                                            : "",
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage>
                                    {form.formState.errors.storage_guidelines?.[
                                      index
                                    ]?.stability_duration && t("required")}
                                  </FormMessage>
                                </FormItem>
                              )}
                            />

                            <div>
                              <FormLabel aria-required>
                                {t("duration_unit")}
                              </FormLabel>
                              <div className="mt-2">
                                <ValueSetSelect
                                  system="system-ucum-units"
                                  value={form.watch(
                                    `storage_guidelines.${index}.stability_duration.unit`,
                                  )}
                                  placeholder={t("e.g., Day, Month")}
                                  onSelect={(code) => {
                                    form.setValue(
                                      `storage_guidelines.${index}.stability_duration.unit`,
                                      {
                                        code: code.code,
                                        display: code.display,
                                        system: code.system,
                                      },
                                    );
                                  }}
                                  showCode={true}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => storageGuidelinesArray.remove(index)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md bg-gray-50 p-4 text-center text-sm text-gray-500">
                    {t("no_storage_guidelines_added")}
                  </div>
                )}
              </div>
            </div>

            {/* Product Definition Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-medium text-gray-900">
                      {t("product_definition")}
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {t("PKF_definitional_description")}
                    </p>
                  </div>
                  {form.watch("definitional") ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => form.setValue("definitional", null)}
                    >
                      <X className="mr-2 size-4" />
                      {t("remove") + " " + t("definition")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        form.setValue("definitional", {
                          intended_routes: [],
                        })
                      }
                    >
                      <PlusCircle className="mr-2 size-4" />
                      {t("add_definition")}
                    </Button>
                  )}
                </div>

                {form.watch("definitional") ? (
                  <div className="space-y-4">
                    <div>
                      <FormField
                        control={form.control}
                        name="definitional.dosage_form"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel aria-required>
                              {t("dosage_form")}
                            </FormLabel>
                            <FormControl>
                              <Select
                                value={field.value?.code || ""}
                                onValueChange={(value) => {
                                  const selectedUnit = DOSAGE_UNITS_CODES.find(
                                    (unit) => unit.code === value,
                                  );
                                  if (selectedUnit)
                                    field.onChange(selectedUnit);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue
                                    placeholder={t("e.g., Tablet, Injection")}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {DOSAGE_UNITS_CODES.map((unit) => (
                                    <SelectItem
                                      key={unit.code}
                                      value={unit.code}
                                    >
                                      {unit.display}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormMessage>
                        {form.formState.errors.definitional && t("required")}
                      </FormMessage>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {t("intended_routes")}
                          </h3>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {t("PKF_intended_routes_description")}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            intendedRoutesArray.append({
                              code: "",
                              display: "",
                              system: "",
                            });
                          }}
                        >
                          <PlusCircle className="mr-2 size-4" />
                          {t("add_route")}
                        </Button>
                      </div>

                      {intendedRoutesArray.fields.length > 0 ? (
                        <div className="space-y-4">
                          {intendedRoutesArray.fields.map((field, index) => (
                            <div
                              key={field.id}
                              className="flex items-start gap-2 rounded-md border p-3"
                            >
                              <div className="flex-1">
                                <FormField
                                  control={form.control}
                                  name={`definitional.intended_routes.${index}`}
                                  render={({ field: routeField }) => (
                                    <FormItem className="flex flex-col">
                                      <FormLabel aria-required>
                                        {t("route")}
                                      </FormLabel>
                                      <FormControl>
                                        <ValueSetSelect
                                          system="system-route"
                                          value={routeField.value}
                                          placeholder={t(
                                            "e.g., Oral, Intravenous",
                                          )}
                                          onSelect={(code) => {
                                            routeField.onChange({
                                              code: code.code,
                                              display: code.display,
                                              system: code.system,
                                            });
                                          }}
                                          showCode={true}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                                <FormMessage>
                                  {form.formState.errors.definitional
                                    ?.intended_routes?.[index] && t("required")}
                                </FormMessage>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  intendedRoutesArray.remove(index)
                                }
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-md bg-gray-50 p-4 text-center text-sm text-gray-500">
                          {t("no_routes_added")}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md bg-gray-50 p-4 text-center text-sm text-gray-500">
                    {t("no_product_definition_added")}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate(`/facility/${facilityId}/settings/product_knowledge`)
                }
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t("saving") : t("save")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Page>
  );
}
