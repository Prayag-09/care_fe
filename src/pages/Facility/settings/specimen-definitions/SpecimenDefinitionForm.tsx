import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, XCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { SPECIMEN_DEFINITION_STATUS_OPTIONS } from "@/types/emr/specimenDefinition/specimenDefinition";
import { SpecimenDefinitionRequest } from "@/types/emr/specimenDefinition/specimenDefinition";
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
          value: z.number().nullable(),
          unit: z.any(), // Code type
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
  initialData?: SpecimenDefinitionRequest;
  onSubmit: (data: SpecimenDefinitionRequest) => void;
  isLoading?: boolean;
}

export function SpecimenDefinitionForm({
  initialData,
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
          minimum_volume: { value: null, unit: null },
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

  const handleCapacityUnitSelect = (code: Code) => {
    form.setValue("type_tested.container.capacity.unit", code);
  };

  const handleMinVolumeUnitSelect = (code: Code) => {
    form.setValue("type_tested.container.minimum_volume.unit", code);
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

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) =>
          onSubmit(data as SpecimenDefinitionRequest),
        )}
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
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type_tested.container.capacity.value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("capacity")}</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={t("value")}
                                {...field}
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? Number(e.target.value)
                                      : null,
                                  )
                                }
                              />
                            </FormControl>
                            <FormField
                              control={form.control}
                              name="type_tested.container.capacity.unit"
                              render={({ field }) => (
                                <FormControl>
                                  <ValueSetSelect
                                    system="ucum"
                                    placeholder={t("unit")}
                                    onSelect={handleCapacityUnitSelect}
                                    value={field.value}
                                    disabled={isLoading}
                                  />
                                </FormControl>
                              )}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type_tested.container.minimum_volume.value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("minimum_volume")}</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={t("value")}
                                {...field}
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? Number(e.target.value)
                                      : null,
                                  )
                                }
                              />
                            </FormControl>
                            <FormField
                              control={form.control}
                              name="type_tested.container.minimum_volume.unit"
                              render={({ field }) => (
                                <FormControl>
                                  <ValueSetSelect
                                    system="ucum"
                                    placeholder={t("unit")}
                                    onSelect={handleMinVolumeUnitSelect}
                                    value={field.value}
                                    disabled={isLoading}
                                  />
                                </FormControl>
                              )}
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                  <FormField
                    control={form.control}
                    name="type_tested.container.preparation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("preparation")}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("preparation")}
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type_tested.retention_time.value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("retention_time")}</FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder={t("value")}
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? Number(e.target.value)
                                    : null,
                                )
                              }
                            />
                          </FormControl>
                          <Select value="days" onValueChange={() => {}}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="days">{t("days")}</SelectItem>
                              <SelectItem value="hours">
                                {t("hours")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
