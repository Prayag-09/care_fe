import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

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
import { Switch } from "@/components/ui/switch";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  PatientIdentifierConfigCreate,
  PatientIdentifierConfigStatus,
  PatientIdentifierConfigUpdate,
  PatientIdentifierUse,
} from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import patientIdentifierConfigApi from "@/types/patient/patientIdentifierConfig/patientIdentifierConfigApi";

const formSchema = z.object({
  config: z.object({
    use: z.nativeEnum(PatientIdentifierUse),
    description: z.string().min(1, "Description is required"),
    system: z.string().min(1, "System is required"),
    required: z.boolean(),
    unique: z.boolean(),
    regex: z.string(),
    display: z.string().min(1, "Display is required"),
    retrieve_config: z.object({
      retrieve_with_dob: z.boolean().optional(),
      retrieve_with_year_of_birth: z.boolean().optional(),
      retrieve_with_otp: z.boolean().optional(),
    }),
  }),
  status: z.nativeEnum(PatientIdentifierConfigStatus),
  facility: z.string().optional().nullable(),
});

interface PatientIdentifierConfigFormProps {
  facilityId?: string;
  configId?: string;
  onSuccess?: () => void;
}

export default function PatientIdentifierConfigForm({
  facilityId,
  configId,
  onSuccess,
}: PatientIdentifierConfigFormProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["patientIdentifierConfig", configId, facilityId],
    queryFn: query(patientIdentifierConfigApi.retrievePatientIdentifierConfig, {
      pathParams: { external_id: configId || "" },
    }),
    enabled: !!configId,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      config: {
        use: PatientIdentifierUse.usual,
        description: "",
        system: "",
        required: false,
        unique: false,
        regex: "",
        display: "",
        retrieve_config: {
          retrieve_with_dob: false,
          retrieve_with_year_of_birth: false,
          retrieve_with_otp: false,
        },
      },
      status: PatientIdentifierConfigStatus.draft,
      facility: facilityId || null,
    },
  });

  useEffect(() => {
    if (config) {
      form.reset({
        config: config.config,
        status: config.status,
        facility: config.facility,
      });
    }
  }, [config, form]);

  const { mutate: createConfig, isPending: isCreating } = useMutation({
    mutationFn: mutate(
      patientIdentifierConfigApi.createPatientIdentifierConfig,
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientIdentifierConfig"] });
      onSuccess?.();
    },
  });

  const { mutate: updateConfig, isPending: isUpdating } = useMutation({
    mutationFn: mutate(
      patientIdentifierConfigApi.updatePatientIdentifierConfig,
      {
        pathParams: { external_id: config?.id || configId || "" },
      },
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientIdentifierConfig"] });
      onSuccess?.();
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (config) {
      updateConfig(values as PatientIdentifierConfigUpdate);
    } else {
      createConfig(values as PatientIdentifierConfigCreate);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          console.log(errors);
        })}
        className="space-y-8"
      >
        {/* Identifier Details Section */}
        <div>
          <h2 className="text-lg font-semibold mb-2">
            {t("identifier_details")}
          </h2>
          <FormDescription>{t("identifier_details_help")}</FormDescription>
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="config.use"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("use")}</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_use")} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(PatientIdentifierUse).map((use) => (
                            <SelectItem key={use} value={use}>
                              {t(use)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>{t("use_help")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="config.display"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("display")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("eg_national_id_card")}
                      />
                    </FormControl>
                    <FormDescription>{t("display_help")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="config.description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("eg_national_id")} />
                    </FormControl>
                    <FormDescription>{t("description_help")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="config.system"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("system")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://example.org/identifier-system"
                      />
                    </FormControl>
                    <FormDescription>{t("system_help")}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="config.regex"
                render={({ field }) => {
                  let regexError = "";
                  try {
                    if (field.value) new RegExp(field.value);
                  } catch {
                    regexError = t("invalid_regex");
                  }
                  return (
                    <FormItem>
                      <FormLabel>{t("regex")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("eg_regex_pattern")} />
                      </FormControl>
                      <FormDescription>{t("regex_help")}</FormDescription>
                      {(regexError || form.formState.errors.config?.regex) && (
                        <div className="text-xs text-red-500 mt-1">
                          {regexError ||
                            form.formState.errors.config?.regex?.message}
                        </div>
                      )}
                    </FormItem>
                  );
                }}
              />
            </div>
          )}
        </div>

        {/* Retrieval Options Section */}
        <div>
          <h2 className="text-lg font-semibold mb-2">
            {t("retrieval_options")}
          </h2>
          <FormDescription>{t("retrieval_options_help")}</FormDescription>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            {/* <FormField
              control={form.control}
              name="config.retrieve_config.retrieve_with_dob"
              render={({ field }) => (
                <FormItem className="flex flex-col md:flex-row md:items-center justify-between rounded-lg border p-4 gap-2 md:gap-0">
                  <div className="flex-1">
                    <FormLabel className="text-base font-medium">
                      {t("retrieve_with_dob")}
                    </FormLabel>
                    <FormDescription>
                      {t("retrieve_with_dob_help")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            /> */}
            <FormField
              control={form.control}
              name="config.retrieve_config.retrieve_with_year_of_birth"
              render={({ field }) => (
                <FormItem className="flex flex-col md:flex-row md:items-center justify-between rounded-lg border p-4 gap-2 md:gap-0">
                  <div className="flex-1">
                    <FormLabel className="text-base font-medium">
                      {t("retrieve_with_year_of_birth")}
                    </FormLabel>
                    <FormDescription>
                      {t("retrieve_with_year_of_birth_help")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            {/* <FormField
              control={form.control}
              name="config.retrieve_config.retrieve_with_otp"
              render={({ field }) => (
                <FormItem className="flex flex-col md:flex-row md:items-center justify-between rounded-lg border p-4 gap-2 md:gap-0">
                  <div className="flex-1">
                    <FormLabel className="text-base font-medium">
                      {t("retrieve_with_otp")}
                    </FormLabel>
                    <FormDescription>
                      {t("retrieve_with_otp_help")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            /> */}
          </div>
        </div>

        {/* Validation & Uniqueness Section */}
        <div>
          <h2 className="text-lg font-semibold mb-2">
            {t("validation_and_uniqueness")}
          </h2>
          <FormDescription>
            {t("validation_and_uniqueness_help")}
          </FormDescription>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <FormField
              control={form.control}
              name="config.required"
              render={({ field }) => (
                <FormItem className="flex flex-col md:flex-row md:items-center justify-between rounded-lg border p-4 gap-2 md:gap-0">
                  <div className="flex-1">
                    <FormLabel className="text-base font-medium">
                      {t("required")}
                    </FormLabel>
                    <FormDescription>{t("required_help")}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="config.unique"
              render={({ field }) => (
                <FormItem className="flex flex-col md:flex-row md:items-center justify-between rounded-lg border p-4 gap-2 md:gap-0">
                  <div className="flex-1">
                    <FormLabel className="text-base font-medium">
                      {t("unique")}
                    </FormLabel>
                    <FormDescription>{t("unique_help")}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Status Section */}
        <div>
          <h2 className="text-lg font-semibold mb-2">{t("status")}</h2>
          <FormDescription>{t("status_help")}</FormDescription>
          <div className="max-w-xs">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("status")}</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_status")} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(PatientIdentifierConfigStatus).map(
                          (status) => (
                            <SelectItem key={status} value={status}>
                              {t(status)}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-6"
          disabled={isCreating || isUpdating}
        >
          {isCreating || isUpdating ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
              {t("saving")}
            </span>
          ) : config ? (
            t("update")
          ) : (
            t("create")
          )}
        </Button>
      </form>
    </Form>
  );
}
