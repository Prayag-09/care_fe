import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import * as React from "react";
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
import RequirementsSelector from "@/components/Common/RequirementsSelector";
import LocationMultiSelect from "@/components/Location/LocationMultiSelect";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import ObservationDefinitionForm from "@/pages/Facility/settings/observationDefinition/ObservationDefinitionForm";
import { CreateSpecimenDefinition } from "@/pages/Facility/settings/specimen-definitions/CreateSpecimenDefinition";
import {
  type ActivityDefinitionCreateSpec,
  type ActivityDefinitionReadSpec,
  type ActivityDefinitionUpdateSpec,
  Category,
  Kind,
  Status,
} from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import observationDefinitionApi from "@/types/emr/observationDefinition/observationDefinitionApi";
import specimenDefinitionApi from "@/types/emr/specimenDefinition/specimenDefinitionApi";
import locationApi from "@/types/location/locationApi";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(1, "Description is required"),
  usage: z.string().min(1, "Usage is required"),
  derived_from_uri: z.string().nullable(),
  status: z.nativeEnum(Status),
  category: z.nativeEnum(Category),
  kind: z.nativeEnum(Kind),
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
    .nullable(),
  specimen_requirements: z.array(z.string()).default([]),
  observation_result_requirements: z.array(z.string()).default([]),
  locations: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

export default function ActivityDefinitionForm({
  facilityId,
  activityDefinitionId,
}: {
  facilityId: string;
  activityDefinitionId?: string;
}) {
  const { t } = useTranslation();

  const isEditMode = Boolean(activityDefinitionId);

  const { data: existingData, isLoading } = useQuery({
    queryKey: ["activityDefinition", activityDefinitionId],
    queryFn: query(activityDefinitionApi.retrieveActivityDefinition, {
      pathParams: {
        activityDefinitionId: activityDefinitionId!,
        facilityId,
      },
    }),
    enabled: isEditMode,
  });

  if (isEditMode && isLoading) {
    return (
      <Page title={t("edit_activity_definition")} hideTitleOnPage>
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("edit_activity_definition")}
            </h1>
          </div>
          <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-8">
            <div className="text-center">
              <div className="mb-2 text-sm text-gray-500">{t("loading")}</div>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <ActivityDefinitionFormContent
      facilityId={facilityId}
      activityDefinitionId={activityDefinitionId}
      existingData={existingData}
    />
  );
}

function ActivityDefinitionFormContent({
  facilityId,
  activityDefinitionId,
  existingData,
}: {
  facilityId: string;
  activityDefinitionId?: string;
  existingData?: ActivityDefinitionReadSpec;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(activityDefinitionId);
  const [specimenSearch, setSpecimenSearch] = React.useState("");
  const [observationSearch, setObservationSearch] = React.useState("");

  const { data: specimenDefinitions, isLoading: isLoadingSpecimens } = useQuery(
    {
      queryKey: ["specimenDefinitions", facilityId, specimenSearch],
      queryFn: query(specimenDefinitionApi.listSpecimenDefinitions, {
        pathParams: { facilityId },
        queryParams: { limit: 100, search: specimenSearch },
      }),
    },
  );

  const { data: observationDefinitions, isLoading: isLoadingObservations } =
    useQuery({
      queryKey: ["observationDefinitions", facilityId, observationSearch],
      queryFn: query(observationDefinitionApi.listObservationDefinition, {
        queryParams: {
          facility: facilityId,
          limit: 100,
          search: observationSearch,
        },
      }),
    });

  const { data: locations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ["locations", facilityId],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        limit: 100,
      },
    }),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues:
      isEditMode && existingData
        ? {
            title: existingData.title,
            slug: existingData.slug,
            description: existingData.description,
            usage: existingData.usage,
            derived_from_uri: existingData.derived_from_uri,
            status: existingData.status,
            category: existingData.category,
            kind: existingData.kind,
            code: existingData.code,
            body_site: existingData.body_site,
            specimen_requirements: existingData.specimen_requirements.map(
              (s) => s.id,
            ),
            observation_result_requirements:
              existingData.observation_result_requirements.map((o) => o.id),
            locations: existingData.locations.map((l) => l.id),
          }
        : {
            status: Status.draft,
            kind: Kind.service_request,
            specimen_requirements: [],
            observation_result_requirements: [],
            locations: [],
            derived_from_uri: null,
            body_site: null,
          },
  });

  const { mutate: createActivityDefinition, isPending: isCreating } =
    useMutation({
      mutationFn: mutate(activityDefinitionApi.createActivityDefinition, {
        pathParams: {
          facilityId,
        },
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["activityDefinitions"] });
        toast.success(t("activity_definition_created_successfully"));
        navigate(`/facility/${facilityId}/settings/activity_definitions`);
      },
    });

  const { mutate: updateActivityDefinition, isPending: isUpdating } =
    useMutation({
      mutationFn: mutate(activityDefinitionApi.updateActivityDefinition, {
        pathParams: {
          activityDefinitionId: activityDefinitionId || "",
          facilityId,
        },
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [
            ["activityDefinition", activityDefinitionId],
            ["activityDefinitions"],
          ],
        });
        toast.success(t("activity_definition_updated_successfully"));
        navigate(`/facility/${facilityId}/settings/activity_definitions`);
      },
    });

  const isPending = isCreating || isUpdating;

  function onSubmit(data: FormValues) {
    if (isEditMode && activityDefinitionId) {
      updateActivityDefinition(data as ActivityDefinitionUpdateSpec);
    } else {
      createActivityDefinition(data as ActivityDefinitionCreateSpec);
    }
  }

  return (
    <Page
      title={
        isEditMode
          ? t("edit_activity_definition")
          : t("create_activity_definition")
      }
      hideTitleOnPage
    >
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditMode
              ? t("edit_activity_definition")
              : t("create_activity_definition")}
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
                    {t("Enter the basic details of the activity")}
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

                <FormField
                  control={form.control}
                  name="usage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("usage")}</FormLabel>
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
                            {Object.values(Status).map((status) => (
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
                            {Object.values(Category).map((category) => (
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
                    name="kind"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("kind")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_kind")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(Kind).map((kind) => (
                              <SelectItem key={kind} value={kind}>
                                {t(kind)}
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
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div>
                  <FormLabel>{t("code")}</FormLabel>
                  <div className="mt-2">
                    <ValueSetSelect
                      system="activity-definition-procedure-code"
                      value={form.watch("code")}
                      placeholder={t("search_for_activity_codes")}
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
                </div>

                <div>
                  <FormLabel>{t("body_site")}</FormLabel>
                  <div className="mt-2">
                    <ValueSetSelect
                      system="system-body-site"
                      value={form.watch("body_site")}
                      placeholder={t("e.g., Right Arm")}
                      onSelect={(code) => {
                        form.setValue("body_site", {
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
            </div>

            {/* Requirements Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-medium text-gray-900">
                    {t("requirements")}
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {t("Specify the requirements for this activity")}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-lg border border-gray-200 shadow-sm p-4">
                    <FormLabel>{t("specimen_requirements")}</FormLabel>
                    <div className="mt-2">
                      <RequirementsSelector
                        title={t("select_specimen_requirements")}
                        description={t(
                          "select_or_create_specimen_requirements",
                        )}
                        value={form.watch("specimen_requirements")}
                        onChange={(values) =>
                          form.setValue("specimen_requirements", values)
                        }
                        options={
                          specimenDefinitions?.results.map((spec) => ({
                            label: spec.title,
                            value: spec.id,
                            details: [
                              {
                                label: t("type"),
                                value: spec.type_collected?.display,
                              },
                              {
                                label: t("container"),
                                value:
                                  spec.type_tested?.container?.description ||
                                  spec.type_tested?.specimen_type?.display,
                              },
                              {
                                label: t("minimum_volume"),
                                value:
                                  spec.type_tested?.container?.minimum_volume
                                    ?.string ||
                                  (spec.type_tested?.container?.minimum_volume
                                    ?.quantity
                                    ? `${spec.type_tested.container.minimum_volume.quantity.value} ${spec.type_tested.container.minimum_volume.quantity.unit.display}`
                                    : undefined),
                              },
                              {
                                label: t("cap"),
                                value:
                                  spec.type_tested?.container?.cap?.display,
                              },
                            ],
                          })) || []
                        }
                        isLoading={isLoadingSpecimens}
                        placeholder={t("select_specimen_requirements")}
                        onSearch={setSpecimenSearch}
                        canCreate={true}
                        createForm={
                          <div className="py-2">
                            <CreateSpecimenDefinition facilityId={facilityId} />
                          </div>
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 shadow-sm p-4">
                    <FormLabel>{t("observation_requirements")}</FormLabel>
                    <div className="mt-2">
                      <RequirementsSelector
                        title={t("select_observation_requirements")}
                        description={t(
                          "select_or_create_observation_requirements",
                        )}
                        value={form.watch("observation_result_requirements")}
                        onChange={(values) =>
                          form.setValue(
                            "observation_result_requirements",
                            values,
                          )
                        }
                        options={
                          observationDefinitions?.results.map((obs) => ({
                            label: obs.title,
                            value: obs.id,
                            details: [
                              {
                                label: t("category"),
                                value: t(obs.category),
                              },
                              {
                                label: t("data_type"),
                                value: t(obs.permitted_data_type),
                              },
                              {
                                label: t("unit"),
                                value: obs.permitted_unit?.display,
                              },
                              {
                                label: t("method"),
                                value: obs.method?.display,
                              },
                              {
                                label: t("components"),
                                value: obs.component
                                  ?.map((c) => c.code?.display)
                                  .join(", "),
                              },
                            ],
                          })) || []
                        }
                        isLoading={isLoadingObservations}
                        placeholder={t("select_observation_requirements")}
                        onSearch={setObservationSearch}
                        canCreate={true}
                        createForm={
                          <div className="py-2">
                            <ObservationDefinitionForm
                              facilityId={facilityId}
                            />
                          </div>
                        }
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 shadow-sm p-4">
                    <FormLabel>{t("locations")}</FormLabel>
                    <div className="mt-2">
                      <RequirementsSelector
                        title={t("location_requirements")}
                        description={t("location_requirements_description")}
                        value={form.watch("locations")}
                        onChange={(values) =>
                          form.setValue("locations", values)
                        }
                        options={
                          locations?.results
                            .filter((location) =>
                              form.watch("locations").includes(location.id),
                            )
                            .map((location) => ({
                              label: location.name,
                              value: location.id,
                              details: [
                                {
                                  label: t("type"),
                                  value: t(`location_form__${location.form}`),
                                },
                                {
                                  label: t("status"),
                                  value: t(location.status),
                                },
                                {
                                  label: t("description"),
                                  value: location.description || undefined,
                                },
                              ],
                            })) || []
                        }
                        isLoading={isLoadingLocations}
                        placeholder={t("select_locations")}
                        customSelector={
                          <LocationMultiSelect
                            facilityId={facilityId}
                            value={form.watch("locations")}
                            onChange={(values) =>
                              form.setValue("locations", values)
                            }
                          />
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/settings/activity_definitions`,
                  )
                }
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditMode
                    ? t("saving")
                    : t("creating")
                  : isEditMode
                    ? t("save")
                    : t("create")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Page>
  );
}
