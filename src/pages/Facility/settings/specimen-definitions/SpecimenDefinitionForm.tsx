import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, XCircle } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import ComboboxQuantityInput from "@/components/Common/ComboboxQuantityInput";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import {
  RETENTION_TIME_UNITS,
  SPECIMEN_DEFINITION_STATUS_OPTIONS,
  SPECIMEN_DEFINITION_UNITS_CODES,
} from "@/types/emr/specimenDefinition/specimenDefinition";
import {
  SpecimenDefinitionCreate,
  SpecimenDefinitionUpdate,
} from "@/types/emr/specimenDefinition/specimenDefinition";
import { Code } from "@/types/questionnaire/code";

const typeTestedSchema = z.object({
  is_derived: z.boolean(),
  specimen_type: z.any(), // Code type
  preference: z.enum(["preferred", "required"]),
  container: z
    .object({
      description: z.string().nullable(),
      capacity: z
        .object({
          value: z.number().nullable(),
          unit: z.any(), // Code type
        })
        .nullable(),
      minimum_volume: z
        .object({
          quantity: z
            .object({
              value: z.number().nullable(),
              unit: z.any(), // Code type
            })
            .nullable(),
          string: z.string().nullable(),
        })
        .nullable(),
      cap: z.any().nullable(), // Code type
      preparation: z.string().nullable(),
    })
    .nullable(),
  requirement: z.string().nullable(),
  retention_time: z
    .object({
      value: z.number().nullable(),
      unit: z.any(), // Code type
    })
    .nullable(),
  single_use: z.boolean().nullable(),
});

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  status: z.enum(SPECIMEN_DEFINITION_STATUS_OPTIONS),
  description: z.string().min(1, "Description is required"),
  derived_from_uri: z.string().nullable(),
  type_collected: z.any().nullable(), // Code type
  patient_preparation: z.array(z.any()), // Code type array
  collection: z.any().nullable(), // Code type
  type_tested: typeTestedSchema.nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface SpecimenDefinitionFormProps {
  initialData?: SpecimenDefinitionCreate;
  specimenDefinitionId?: string;
  onSubmit: (data: SpecimenDefinitionCreate | SpecimenDefinitionUpdate) => void;
  isLoading?: boolean;
}

export function SpecimenDefinitionForm({
  initialData,
  specimenDefinitionId,
  onSubmit,
  isLoading,
}: SpecimenDefinitionFormProps) {
  const { t } = useTranslation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      slug: initialData?.slug || "",
      status: initialData?.status || "draft",
      description: initialData?.description || "",
      derived_from_uri: initialData?.derived_from_uri || null,
      type_collected: initialData?.type_collected || null,
      patient_preparation: initialData?.patient_preparation || [null],
      collection: initialData?.collection || null,
      type_tested: initialData?.type_tested || {
        is_derived: false,
        specimen_type: null,
        preference: "preferred",
        container: {
          description: "",
          capacity: { value: null, unit: null },
          minimum_volume: {
            quantity: { value: null, unit: null },
            string: null,
          },
          cap: null,
          preparation: "",
        },
        requirement: "",
        retention_time: { value: null, unit: null },
        single_use: false,
      },
    },
  });

  const handleTypeCollectedSelect = (code: Code) => {
    form.setValue("type_collected", code);
  };

  const handleCollectionMethodSelect = (code: Code) => {
    form.setValue("collection", code);
  };

  const handleCapTypeSelect = (code: Code) => {
    form.setValue("type_tested.container.cap", code);
  };

  const handlePatientPreparationSelect = (code: Code, index: number) => {
    const currentPreparations = form.getValues("patient_preparation");
    const newPreparations = [...currentPreparations];
    newPreparations[index] = code;
    form.setValue("patient_preparation", newPreparations);
  };

  const addPatientPreparation = () => {
    const currentPreparations = form.getValues("patient_preparation");
    form.setValue("patient_preparation", [...currentPreparations, null]);
  };

  const removePatientPreparation = (index: number) => {
    const currentPreparations = form.getValues("patient_preparation");
    const newPreparations = currentPreparations.filter((_, i) => i !== index);
    form.setValue("patient_preparation", newPreparations);
  };

  const handleMinimumVolumeTypeChange = (type: string) => {
    form.setValue("type_tested.container.minimum_volume", {
      quantity:
        type === "quantity"
          ? { value: null, unit: SPECIMEN_DEFINITION_UNITS_CODES[0] }
          : null,
      string: type === "text" ? "" : null,
    });
  };

  const handleMinimumVolumeChange = (
    type: "quantity" | "string",
    value: { value: number | null; unit: Code | null } | string | null,
  ) => {
    if (type === "quantity") {
      form.setValue("type_tested.container.minimum_volume", {
        quantity: value as { value: number | null; unit: Code | null },
        string: null,
      });
    } else {
      form.setValue("type_tested.container.minimum_volume", {
        quantity: null,
        string: value as string,
      });
    }
  };

  useEffect(() => {
    console.log(form.watch());
  }, [form.watch()]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => {
          if (specimenDefinitionId) {
            onSubmit(data as SpecimenDefinitionUpdate);
          } else {
            onSubmit(data as SpecimenDefinitionCreate);
          }
        })}
        className="space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle>{t("specimen_definition")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t("basic_information")}</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("title")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("title")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("slug")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("unique_identifier")}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                          {SPECIMEN_DEFINITION_STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {t(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          placeholder={t("uri")}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t("description")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Specimen Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">{t("specimen_details")}</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type_collected"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("type_collected")}</FormLabel>
                      <FormControl>
                        <ValueSetSelect
                          system="system-specimen_type-code"
                          placeholder={t("select_type_collected")}
                          onSelect={handleTypeCollectedSelect}
                          value={field.value}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="collection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("collection")}</FormLabel>
                      <FormControl>
                        <ValueSetSelect
                          system="system-specimen_collection_code"
                          placeholder={t("select_collection")}
                          onSelect={handleCollectionMethodSelect}
                          value={field.value}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="patient_preparation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("patient_preparation")}</FormLabel>
                    <div className="space-y-2">
                      {field.value.map(
                        (preparation: Code | null, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <FormControl>
                              <ValueSetSelect
                                system="system-prepare_patient_prior_specimen_code"
                                placeholder={t("select_patient_preparation")}
                                onSelect={(code) =>
                                  handlePatientPreparationSelect(code, index)
                                }
                                value={preparation}
                                disabled={isLoading}
                              />
                            </FormControl>
                            {field.value.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removePatientPreparation(index)}
                                className="h-10 w-10"
                              >
                                <XCircle className="h-5 w-5" />
                              </Button>
                            )}
                          </div>
                        ),
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addPatientPreparation}
                        className="w-full"
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {t("add")}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Type Tested Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {t("type_tested_information")}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type_tested.is_derived"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>{t("is_derived")}</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type_tested.specimen_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("specimen_type")}</FormLabel>
                      <FormControl>
                        <ValueSetSelect
                          system="system-specimen_type-code"
                          placeholder={t("select_specimen_type")}
                          onSelect={(code) =>
                            form.setValue("type_tested.specimen_type", code)
                          }
                          value={field.value}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type_tested.preference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("preference")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_preference")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="preferred">
                            {t("preferred")}
                          </SelectItem>
                          <SelectItem value="required">
                            {t("required")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-medium">
                  {t("container_information")}
                </h4>
                <FormField
                  control={form.control}
                  name="type_tested.container.description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("description")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("description")}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type_tested.container.capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("capacity")}</FormLabel>
                          <FormControl>
                            <ComboboxQuantityInput
                              quantity={
                                field.value
                                  ? {
                                      value: field.value.value || 0,
                                      unit: field.value.unit,
                                    }
                                  : {
                                      value: 0,
                                      unit: SPECIMEN_DEFINITION_UNITS_CODES[0],
                                    }
                              }
                              onChange={field.onChange}
                              disabled={isLoading}
                              placeholder={t("enter_capacity")}
                              units={SPECIMEN_DEFINITION_UNITS_CODES}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <FormLabel>{t("minimum_volume")}</FormLabel>
                      <Tabs
                        defaultValue="quantity"
                        className="w-full"
                        onValueChange={handleMinimumVolumeTypeChange}
                        value={
                          form.watch(
                            "type_tested.container.minimum_volume.quantity",
                          )
                            ? "quantity"
                            : "text"
                        }
                      >
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="quantity">
                            {t("quantity")}
                          </TabsTrigger>
                          <TabsTrigger value="text">{t("text")}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="quantity">
                          <FormField
                            control={form.control}
                            name="type_tested.container.minimum_volume.quantity"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <ComboboxQuantityInput
                                    quantity={
                                      field.value
                                        ? {
                                            value: field.value.value || 0,
                                            unit: field.value.unit,
                                          }
                                        : {
                                            value: 0,
                                            unit: SPECIMEN_DEFINITION_UNITS_CODES[0],
                                          }
                                    }
                                    onChange={(value) =>
                                      handleMinimumVolumeChange(
                                        "quantity",
                                        value,
                                      )
                                    }
                                    disabled={isLoading}
                                    placeholder={t("enter_minimum_volume")}
                                    units={SPECIMEN_DEFINITION_UNITS_CODES}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                        <TabsContent value="text">
                          <FormField
                            control={form.control}
                            name="type_tested.container.minimum_volume.string"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder={t("enter_minimum_volume")}
                                    {...field}
                                    value={field.value || ""}
                                    disabled={isLoading}
                                    onChange={(e) =>
                                      handleMinimumVolumeChange(
                                        "string",
                                        e.target.value,
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="type_tested.container.cap"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("cap")}</FormLabel>
                        <FormControl>
                          <ValueSetSelect
                            system="system-container_cap-code"
                            placeholder={t("select_cap")}
                            onSelect={handleCapTypeSelect}
                            value={field.value}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="type_tested.container.preparation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("preparation")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("preparation")}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type_tested.requirement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("requirement")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("requirement")}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="type_tested.retention_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("retention_time")}</FormLabel>
                        <FormControl>
                          <ComboboxQuantityInput
                            quantity={
                              field.value
                                ? {
                                    value: field.value.value || 0,
                                    unit: field.value.unit,
                                  }
                                : { value: 0, unit: RETENTION_TIME_UNITS[0] }
                            }
                            onChange={field.onChange}
                            disabled={isLoading}
                            placeholder={t("enter_retention_time")}
                            units={RETENTION_TIME_UNITS}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="type_tested.single_use"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>{t("single_use")}</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button type="button" variant="outline">
            {t("cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {t("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
