import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, X } from "lucide-react";
import { navigate } from "raviger";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
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

import Page from "@/components/Common/Page";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import mutate from "@/Utils/request/mutate";
import {
  OBSERVATION_DEFINITION_CATEGORY,
  OBSERVATION_DEFINITION_STATUS,
  type ObservationDefinitionComponentSpec,
  type ObservationDefinitionCreateSpec,
  QuestionType,
} from "@/types/emr/observationDefinition/observationDefinition";
import observationDefinitionApi from "@/types/emr/observationDefinition/observationDefinitionApi";

const QUESTION_TYPES: [QuestionType, ...QuestionType[]] = [
  "boolean",
  "decimal",
  "integer",
  "dateTime",
  "time",
  "string",
  "quantity",
];

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(OBSERVATION_DEFINITION_STATUS),
  category: z.enum(OBSERVATION_DEFINITION_CATEGORY as [string, ...string[]]),
  permitted_data_type: z.enum(QUESTION_TYPES),
  code: z.object({
    code: z.string().min(1, "Code is required"),
    display: z.string().min(1, "Display name is required"),
    system: z.string().min(1, "System is required"),
  }),
  body_site: z
    .object({
      code: z.string().min(1, "Code is required"),
      display: z.string().min(1, "Display name is required"),
      system: z.string().min(1, "System is required"),
    })
    .optional(),
  method: z
    .object({
      code: z.string().min(1, "Code is required"),
      display: z.string().min(1, "Display name is required"),
      system: z.string().min(1, "System is required"),
    })
    .optional(),
  permitted_unit: z
    .object({
      code: z.string().min(1, "Code is required"),
      display: z.string().min(1, "Display name is required"),
      system: z.string().min(1, "System is required"),
    })
    .optional(),
  component: z
    .array(
      z.object({
        code: z.object({
          code: z.string(),
          display: z.string(),
          system: z.string(),
        }),
        permitted_data_type: z.enum(QUESTION_TYPES),
        permitted_unit: z.object({
          code: z.string(),
          display: z.string(),
          system: z.string(),
        }),
      }),
    )
    .default([]),
});

type FormValues = z.infer<typeof formSchema>;

export default function ObservationDefinitionForm({
  facilityId,
}: {
  facilityId: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: "draft",
      component: [],
    },
  });

  const { mutate: createObservationDefinition, isPending } = useMutation({
    mutationFn: mutate(observationDefinitionApi.createObservationDefinition),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["observationDefinitions"] });
      toast.success(t("observation_definition_created_successfully"));
      navigate(`/facility/${facilityId}/settings/observation_definitions`);
    },
  });

  function onSubmit(data: FormValues) {
    const payload: ObservationDefinitionCreateSpec = {
      ...data,
      facility: facilityId,
      id: crypto.randomUUID(),
      component: data.component as ObservationDefinitionComponentSpec[],
    };
    createObservationDefinition(payload);
  }

  return (
    <Page title={t("create_observation_definition")} hideTitleOnPage>
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {t("create_observation_definition")}
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
                    {t("Enter the basic details and type of the observation")}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("slug")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <Textarea {...field} className="min-h-[60px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
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
                            {OBSERVATION_DEFINITION_STATUS.map((status) => (
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
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("category")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_category")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {OBSERVATION_DEFINITION_CATEGORY.map((category) => (
                              <SelectItem key={category} value={category}>
                                {t(category)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="permitted_data_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("data_type")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("select_data_type")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {QUESTION_TYPES.map((type) => (
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
                    <FormLabel>{t("loinc_code")}</FormLabel>
                    <div className="mt-2">
                      <ValueSetSelect
                        system="system-observation"
                        value={form.watch("code")}
                        placeholder={t("search_for_observation_codes")}
                        onSelect={(code) => {
                          form.setValue("code.code", code.code);
                          form.setValue("code.display", code.display);
                          form.setValue("code.system", code.system);
                        }}
                        showCode={true}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-medium text-gray-900">
                    {t("additional_details")}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      ({t("optional")})
                    </span>
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {t(
                      "Specify additional details about how and where this observation is performed",
                    )}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <FormLabel>{t("body_site")}</FormLabel>
                    <ValueSetSelect
                      system="system-body-site"
                      value={form.watch("body_site")}
                      placeholder={t("e.g., Right Arm")}
                      onSelect={(code) => {
                        form.setValue("body_site.code", code.code);
                        form.setValue("body_site.display", code.display);
                        form.setValue("body_site.system", code.system);
                      }}
                      showCode={true}
                    />
                  </div>

                  <div>
                    <FormLabel>{t("method")}</FormLabel>
                    <ValueSetSelect
                      system="system-collection-method"
                      value={form.watch("method")}
                      placeholder={t("e.g., Automatic")}
                      onSelect={(code) => {
                        form.setValue("method.code", code.code);
                        form.setValue("method.display", code.display);
                        form.setValue("method.system", code.system);
                      }}
                      showCode={true}
                    />
                  </div>

                  <div>
                    <FormLabel>{t("unit")}</FormLabel>
                    <ValueSetSelect
                      system="system-ucum-units"
                      value={form.watch("permitted_unit")}
                      placeholder={t("e.g., mmHg")}
                      onSelect={(code) => {
                        form.setValue("permitted_unit.code", code.code);
                        form.setValue("permitted_unit.display", code.display);
                        form.setValue("permitted_unit.system", code.system);
                      }}
                      showCode={true}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Components Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-medium text-gray-900">
                      {t("components")}{" "}
                      <span className="text-sm font-normal text-gray-500">
                        (Optional)
                      </span>
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {t(
                        "Add components if this observation needs to collect multiple related values",
                      )}
                    </p>
                  </div>
                  {form.watch("component").length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentComponents = form.getValues("component");
                        form.setValue("component", [
                          ...currentComponents,
                          {
                            code: { code: "", display: "", system: "" },
                            permitted_data_type: "string",
                            permitted_unit: {
                              code: "",
                              display: "",
                              system: "",
                            },
                          },
                        ]);
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {t("Add component")}
                    </Button>
                  )}
                </div>

                {form.watch("component").length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
                    <p className="mb-2 text-sm text-gray-500">
                      {t(
                        "Components are useful for observations that need multiple values, like:",
                      )}
                    </p>
                    <ul className="mb-4 text-sm text-gray-600">
                      <li>• Blood Pressure (Systolic + Diastolic)</li>
                      <li>• Complete Blood Count (RBC + WBC + Platelets)</li>
                    </ul>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const currentComponents = form.getValues("component");
                        form.setValue("component", [
                          ...currentComponents,
                          {
                            code: { code: "", display: "", system: "" },
                            permitted_data_type: "string",
                            permitted_unit: {
                              code: "",
                              display: "",
                              system: "",
                            },
                          },
                        ]);
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      {t("Add your first component")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {form.watch("component").map((_, index) => (
                      <div
                        key={index}
                        className="relative rounded-lg border border-gray-200 bg-white p-4"
                      >
                        <div className="absolute right-3 top-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-full hover:bg-gray-100"
                            onClick={() => {
                              const currentComponents =
                                form.getValues("component");
                              form.setValue(
                                "component",
                                currentComponents.filter((_, i) => i !== index),
                              );
                            }}
                          >
                            <X className="h-4 w-4 text-gray-500" />
                          </Button>
                        </div>

                        <div className="mb-2 text-sm font-medium text-gray-700">
                          Component {index + 1}
                        </div>

                        <div className="grid gap-4">
                          <div>
                            <FormLabel>{t("code")}</FormLabel>
                            <div className="mt-2">
                              <ValueSetSelect
                                system="system-observation"
                                placeholder={t("search_for_observation_codes")}
                                value={form.getValues(
                                  `component.${index}.code`,
                                )}
                                showCode={true}
                                onSelect={(code) => {
                                  form.setValue(`component.${index}.code`, {
                                    code: code.code,
                                    display: code.display,
                                    system: code.system,
                                  });
                                }}
                              />
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name={`component.${index}.permitted_data_type`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>{t("data_type")}</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue
                                          placeholder={t("select_data_type")}
                                        />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {QUESTION_TYPES.map((type) => (
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
                              <FormLabel>{t("unit")}</FormLabel>
                              <div className="mt-2">
                                <ValueSetSelect
                                  system="system-ucum-units"
                                  placeholder={t("search_for_units")}
                                  value={form.getValues(
                                    `component.${index}.permitted_unit`,
                                  )}
                                  showCode={true}
                                  onSelect={(code) => {
                                    form.setValue(
                                      `component.${index}.permitted_unit`,
                                      {
                                        code: code.code,
                                        display: code.display,
                                        system: code.system,
                                      },
                                    );
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate("/observation-definitions")}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t("creating") : t("create")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Page>
  );
}
