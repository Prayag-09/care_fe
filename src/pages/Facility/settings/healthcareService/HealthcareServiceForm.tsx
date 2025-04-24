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
import { Textarea } from "@/components/ui/textarea";

import IconPicker from "@/components/Common/IconPicker";
import Page from "@/components/Common/Page";
import RequirementsSelector from "@/components/Common/RequirementsSelector";
import LocationMultiSelect from "@/components/Location/LocationMultiSelect";

// import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  type HealthcareServiceCreateSpec,
  type HealthcareServiceReadSpec,
  type HealthcareServiceUpdateSpec,
} from "@/types/healthcareService/healthcareService";
import healthcareServiceApi from "@/types/healthcareService/healthcareServiceApi";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  //   service_type: z.object({
  //     code: z.string().min(1, "Code is required"),
  //     display: z.string().min(1, "Display name is required"),
  //     system: z.string().min(1, "System is required"),
  //   }),
  styling_metadata: z
    .object({
      careIcon: z.string(),
    })
    .nullable(),
  extra_details: z.string(),
  locations: z.array(z.string()).min(1, "At least one location is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function HealthcareServiceForm({
  facilityId,
  healthcareServiceId,
}: {
  facilityId: string;
  healthcareServiceId?: string;
}) {
  const { t } = useTranslation();
  const isEditMode = Boolean(healthcareServiceId);

  const { data: existingData, isLoading } = useQuery({
    queryKey: ["healthcareService", healthcareServiceId],
    queryFn: query(healthcareServiceApi.retrieveHealthcareService, {
      pathParams: {
        facilityId,
        healthcareServiceId: healthcareServiceId!,
      },
    }),
    enabled: isEditMode,
  });

  if (isEditMode && isLoading) {
    return (
      <Page title={t("edit_healthcare_service")} hideTitleOnPage>
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("edit_healthcare_service")}
            </h1>
          </div>
          <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-8">
            <div className="text-center">
              <div className="mb-2 text-sm text-gray-500">
                {t("loading_healthcare_service")}
              </div>
            </div>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <HealthcareServiceFormContent
      facilityId={facilityId}
      healthcareServiceId={healthcareServiceId}
      existingData={existingData}
    />
  );
}

function HealthcareServiceFormContent({
  facilityId,
  healthcareServiceId,
  existingData,
}: {
  facilityId: string;
  healthcareServiceId?: string;
  existingData?: HealthcareServiceReadSpec;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(healthcareServiceId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues:
      isEditMode && existingData
        ? {
            name: existingData.name,
            // service_type: existingData.service_type,
            styling_metadata: existingData.styling_metadata,
            extra_details: existingData.extra_details,
            locations: existingData.locations.map((loc) => loc.id),
          }
        : {
            styling_metadata: null,
            extra_details: "",
            locations: [],
          },
  });

  const { mutate: createHealthcareService, isPending: isCreating } =
    useMutation({
      mutationFn: mutate(healthcareServiceApi.createHealthcareService, {
        pathParams: {
          facilityId,
        },
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["healthcareServices"] });
        toast.success(t("healthcare_service_created_successfully"));
        navigate(`/facility/${facilityId}/settings/healthcare_services`);
      },
    });

  const { mutate: updateHealthcareService, isPending: isUpdating } =
    useMutation({
      mutationFn: mutate(healthcareServiceApi.updateHealthcareService, {
        pathParams: {
          facilityId,
          healthcareServiceId: healthcareServiceId || "",
        },
      }),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["healthcareServices"] });
        toast.success(t("healthcare_service_updated_successfully"));
        navigate(`/facility/${facilityId}/settings/healthcare_services`);
      },
    });

  const isPending = isCreating || isUpdating;

  function onSubmit(data: FormValues) {
    if (isEditMode && healthcareServiceId) {
      updateHealthcareService({
        ...data,
        facility: facilityId,
      } as HealthcareServiceUpdateSpec);
    } else {
      const payload: HealthcareServiceCreateSpec = {
        ...data,
        facility: facilityId,
      };
      createHealthcareService(payload);
    }
  }

  return (
    <Page
      title={
        isEditMode
          ? t("edit_healthcare_service")
          : t("create_healthcare_service")
      }
      hideTitleOnPage
    >
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditMode
              ? t("edit_healthcare_service")
              : t("create_healthcare_service")}
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
                    {t("Enter the basic details of the healthcare service")}
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("name")}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* <div>
                  <FormLabel>{t("service_type")}</FormLabel>
                  <div className="mt-2">
                    <ValueSetSelect
                      system="system-service-type"
                      value={form.watch("service_type")}
                      placeholder={t("search_for_service_types")}
                      onSelect={(code) => {
                        form.setValue("service_type", {
                          code: code.code,
                          display: code.display,
                          system: code.system,
                        });
                      }}
                      showCode={true}
                    />
                  </div>
                </div> */}

                <FormField
                  control={form.control}
                  name="extra_details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("extra_details")}</FormLabel>
                      <FormControl>
                        <Textarea {...field} className="min-h-[60px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Locations Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-medium text-gray-900">
                    {t("locations")}
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {t("Select the locations where this service is available")}
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="locations"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RequirementsSelector
                          title={t("location_requirements")}
                          description={t("location_requirements_description")}
                          value={field.value}
                          onChange={field.onChange}
                          options={[]}
                          isLoading={false}
                          placeholder={t("select_locations")}
                          customSelector={
                            <LocationMultiSelect
                              facilityId={facilityId}
                              value={field.value}
                              onChange={field.onChange}
                            />
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Styling Section */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-medium text-gray-900">
                    {t("styling")}{" "}
                    <span className="text-sm font-normal text-gray-500">
                      ({t("optional")})
                    </span>
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {t("Customize how this service appears in the UI")}
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="styling_metadata.careIcon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("icon")}</FormLabel>
                      <FormControl>
                        <IconPicker
                          value={field.value || ""}
                          onChange={(value) => {
                            form.setValue("styling_metadata", {
                              careIcon: value,
                            });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/settings/healthcare_services`,
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
