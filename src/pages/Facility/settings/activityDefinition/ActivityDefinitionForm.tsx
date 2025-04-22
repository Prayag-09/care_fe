import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import query from "@/Utils/request/query";
import {
  type ActivityDefinitionCreateSpec,
  type ActivityDefinitionReadSpec,
  type ActivityDefinitionUpdateSpec,
  Category,
  Kind,
  Status,
} from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";

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
              <div className="mb-2 text-sm text-gray-500">
                {t("loading_activity_definition")}
              </div>
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

                {/* TODO: Add multi-select components for:
                  - specimen_requirements
                  - observation_result_requirements
                  - locations
                */}
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
