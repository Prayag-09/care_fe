import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronsUpDown, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { FieldError } from "@/components/Questionnaire/QuestionTypes/FieldError";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import query from "@/Utils/request/query";
import { Category } from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import {
  Intent,
  Priority,
  ServiceRequestApplyActivityDefinitionSpec,
  ServiceRequestReadSpec,
  Status,
} from "@/types/emr/serviceRequest/serviceRequest";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";
import { QuestionValidationError } from "@/types/questionnaire/batch";
import { QuestionnaireResponse } from "@/types/questionnaire/form";

interface ServiceRequestQuestionProps {
  encounterId: string;
  facilityId: string;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: any[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  errors?: QuestionValidationError[];
}

const SERVICE_REQUEST_FIELDS = {
  TITLE: {
    key: "title",
    required: true,
  },
  STATUS: {
    key: "status",
    required: true,
  },
  INTENT: {
    key: "intent",
    required: true,
  },
  PRIORITY: {
    key: "priority",
    required: true,
  },
  CATEGORY: {
    key: "category",
    required: true,
  },
  CODE: {
    key: "code",
    required: true,
  },
} as const;

export function validateServiceRequestQuestion(
  values: ServiceRequestReadSpec[],
  questionId: string,
): QuestionValidationError[] {
  return values.reduce((errors: QuestionValidationError[], value, index) => {
    const fieldErrors = Object.entries(SERVICE_REQUEST_FIELDS)
      .filter(([_, field]) => field.required && !value[field.key])
      .map(([_, field]) => ({
        question_id: questionId,
        error: "field_required",
        type: "validation_error",
        field_key: field.key,
        index,
      }));

    return [...errors, ...fieldErrors];
  }, []);
}

function SelectedItemCard({
  title,
  details,
  onRemove,
}: {
  title: string;
  details: { label: string; value: string | undefined }[];
  onRemove: () => void;
}) {
  return (
    <div className="w-full relative flex flex-col rounded-sm border border-gray-200 bg-white px-2 py-1">
      <Button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-2 top-0 rounded-full p-1 cursor-pointer"
        variant="ghost"
      >
        <Trash2 className="size-4 text-gray-500" />
      </Button>
      <p className="mb-2 font-medium text-sm text-gray-900">{title}</p>
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
        {details
          .filter(({ value }) => value)
          .map(({ label, value }, index) => (
            <div key={index} className="flex text-sm">
              <span className="text-gray-500">{label}: </span>
              <span className="ml-1 text-gray-900">{value}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

function RequirementsSelector({
  value,
  onChange,
  options,
  isLoading,
  placeholder,
  onSearch,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  options: {
    label: string;
    value: string;
    details: { label: string; value: string | undefined }[];
  }[];
  isLoading: boolean;
  placeholder: string;
  onSearch: (query: string) => void;
}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const selectedItems = options.filter((option) =>
    value.includes(option.value),
  );

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const removeItem = (itemValue: string) => {
    onChange(value.filter((v) => v !== itemValue));
  };

  return (
    <div className="flex flex-col gap-3">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2 truncate">
              {value.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="font-medium">{value.length}</span>
                  {t("items_selected")}
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput
              placeholder={t("search")}
              onValueChange={onSearch}
              className="h-9"
            />
            <CommandEmpty>{t("no_results")}</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {t("loading")}
                </div>
              ) : (
                options.map((option) => {
                  const isSelected = value.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => toggleOption(option.value)}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2"
                    >
                      <div
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50",
                        )}
                      >
                        {isSelected && <Check className="size-3" />}
                      </div>
                      <span>{option.label}</span>
                    </CommandItem>
                  );
                })
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedItems.length > 0 && (
        <div className="flex flex-col gap-2">
          {selectedItems.map((item) => (
            <SelectedItemCard
              key={item.value}
              title={item.label}
              details={item.details}
              onRemove={() => removeItem(item.value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ServiceRequestFormProps {
  serviceRequest: ServiceRequestApplyActivityDefinitionSpec;
  onUpdate?: (updates: Partial<ServiceRequestReadSpec>) => void;
  onRemove?: () => void;
  disabled?: boolean;
  errors?: QuestionValidationError[];
  questionId?: string;
  index?: number;
  isPreview?: boolean;
  facilityId: string;
}

function ServiceRequestForm({
  facilityId,
  serviceRequest,
  onUpdate,
  onRemove,
  disabled,
  errors,
  questionId,
  index,
  isPreview = false,
}: ServiceRequestFormProps) {
  const { t } = useTranslation();
  const [locationSearch, setLocationSearch] = useState("");
  const { data: locations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ["locations", locationSearch],
    queryFn: query(locationApi.list, {
      pathParams: {
        facility_id: facilityId,
      },
      queryParams: {
        limit: 100,
        search: locationSearch,
      },
    }),
  });

  if (isPreview) {
    return (
      <div className="rounded-md border border-primary-500 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold">
              {serviceRequest.service_request.title}
            </p>
            <span className="text-sm text-gray-500">
              {serviceRequest.service_request.code.display} {" | "}
              {serviceRequest.service_request.code.system} {" | "}
              {serviceRequest.service_request.code.code}
            </span>
          </div>
          {onRemove && (
            <Button variant="ghost" size="icon" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <div className="space-y-2">
            <Label>
              {t("status")} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={serviceRequest.service_request.status}
              onValueChange={(value: Status) => onUpdate?.({ status: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select_status")} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Status).map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {questionId && index !== undefined && (
              <FieldError
                fieldKey={SERVICE_REQUEST_FIELDS.STATUS.key}
                questionId={questionId}
                errors={errors}
                index={index}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>
              {t("intent")} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={serviceRequest.service_request.intent}
              onValueChange={(value: Intent) => onUpdate?.({ intent: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select_intent")} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Intent).map((intent) => (
                  <SelectItem key={intent} value={intent}>
                    {t(intent)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {questionId && index !== undefined && (
              <FieldError
                fieldKey={SERVICE_REQUEST_FIELDS.INTENT.key}
                questionId={questionId}
                errors={errors}
                index={index}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>
              {t("priority")} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={serviceRequest.service_request.priority}
              onValueChange={(value: Priority) =>
                onUpdate?.({ priority: value })
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select_priority")} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Priority).map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {t(priority)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {questionId && index !== undefined && (
              <FieldError
                fieldKey={SERVICE_REQUEST_FIELDS.PRIORITY.key}
                questionId={questionId}
                errors={errors}
                index={index}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>
              {t("category")} <span className="text-red-500">*</span>
            </Label>
            <Select
              value={serviceRequest.service_request.category}
              onValueChange={(value: Category) =>
                onUpdate?.({ category: value })
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select_category")} />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Category).map((category) => (
                  <SelectItem key={category} value={category}>
                    {t(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {questionId && index !== undefined && (
              <FieldError
                fieldKey={SERVICE_REQUEST_FIELDS.CATEGORY.key}
                questionId={questionId}
                errors={errors}
                index={index}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("body_site")}</Label>
            <ValueSetSelect
              system="system-body-site"
              value={serviceRequest.service_request.body_site}
              onSelect={(code) => onUpdate?.({ body_site: code })}
              placeholder={t("select_body_site")}
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("do_not_perform")}</Label>
            <Select
              value={
                serviceRequest.service_request.do_not_perform ? "true" : "false"
              }
              onValueChange={(value) =>
                onUpdate?.({ do_not_perform: value === "true" })
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("select_option")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">{t("yes")}</SelectItem>
                <SelectItem value="false">{t("no")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("patient_instruction")}</Label>
            <Textarea
              value={serviceRequest.service_request.patient_instruction || ""}
              onChange={(e) =>
                onUpdate?.({ patient_instruction: e.target.value })
              }
              disabled={disabled}
              placeholder={t("enter_patient_instructions")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("note")}</Label>
            <Textarea
              value={serviceRequest.service_request.note || ""}
              onChange={(e) => onUpdate?.({ note: e.target.value })}
              disabled={disabled}
              placeholder={t("add_notes")}
            />
          </div>

          <div className="space-y-2 col-span-2">
            <Label>{t("locations")}</Label>
            <RequirementsSelector
              value={serviceRequest.service_request.locations || []}
              onChange={(values) =>
                onUpdate?.({ locations: values as unknown as LocationList[] })
              }
              options={
                locations?.results.map((location: LocationList) => ({
                  label: location.name,
                  value: location.id,
                  details: [
                    {
                      label: t("type"),
                      value: t(`location_form__${location.form}`),
                    },
                    { label: t("status"), value: t(location.status) },
                    {
                      label: t("description"),
                      value: location.description || undefined,
                    },
                  ],
                })) || []
              }
              isLoading={isLoadingLocations}
              placeholder={t("select_locations")}
              onSearch={setLocationSearch}
            />
          </div>
        </div>
        {isPreview && (
          <div className="flex justify-end">
            <Button
              onClick={() => onUpdate?.({})}
              data-cy="add-service-request"
            >
              {t("add")}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Collapsible defaultOpen={false}>
      <div className="rounded-md border border-gray-200">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-2 hover:bg-gray-50 cursor-pointer">
          <div className="flex flex-col gap-1 items-start">
            <p className="text-sm font-semibold">
              {serviceRequest.service_request.title}
            </p>
            <span className="text-sm text-gray-500">
              {serviceRequest.service_request.code.display} {" | "}
              {serviceRequest.service_request.code.system} {" | "}
              {serviceRequest.service_request.code.code}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onRemove();
                }}
                disabled={disabled}
                data-cy="remove-service-request"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-4 space-y-4">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  {t("status")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={serviceRequest.service_request.status}
                  onValueChange={(value: Status) =>
                    onUpdate?.({ status: value })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_status")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Status).map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {questionId && index !== undefined && (
                  <FieldError
                    fieldKey={SERVICE_REQUEST_FIELDS.STATUS.key}
                    questionId={questionId}
                    errors={errors}
                    index={index}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  {t("intent")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={serviceRequest.service_request.intent}
                  onValueChange={(value: Intent) =>
                    onUpdate?.({ intent: value })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_intent")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Intent).map((intent) => (
                      <SelectItem key={intent} value={intent}>
                        {t(intent)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {questionId && index !== undefined && (
                  <FieldError
                    fieldKey={SERVICE_REQUEST_FIELDS.INTENT.key}
                    questionId={questionId}
                    errors={errors}
                    index={index}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  {t("priority")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={serviceRequest.service_request.priority}
                  onValueChange={(value: Priority) =>
                    onUpdate?.({ priority: value })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_priority")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Priority).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {t(priority)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {questionId && index !== undefined && (
                  <FieldError
                    fieldKey={SERVICE_REQUEST_FIELDS.PRIORITY.key}
                    questionId={questionId}
                    errors={errors}
                    index={index}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  {t("category")} <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={serviceRequest.service_request.category}
                  onValueChange={(value: Category) =>
                    onUpdate?.({ category: value })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_category")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(Category).map((category) => (
                      <SelectItem key={category} value={category}>
                        {t(category)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {questionId && index !== undefined && (
                  <FieldError
                    fieldKey={SERVICE_REQUEST_FIELDS.CATEGORY.key}
                    questionId={questionId}
                    errors={errors}
                    index={index}
                  />
                )}
              </div>

              <div className="space-y-2">
                <Label>{t("body_site")}</Label>
                <ValueSetSelect
                  system="system-body-site"
                  value={serviceRequest.service_request.body_site}
                  onSelect={(code) => onUpdate?.({ body_site: code })}
                  placeholder={t("select_body_site")}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("do_not_perform")}</Label>
                <Select
                  value={
                    serviceRequest.service_request.do_not_perform
                      ? "true"
                      : "false"
                  }
                  onValueChange={(value) =>
                    onUpdate?.({ do_not_perform: value === "true" })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("select_option")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">{t("yes")}</SelectItem>
                    <SelectItem value="false">{t("no")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("patient_instruction")}</Label>
                <Textarea
                  value={
                    serviceRequest.service_request.patient_instruction || ""
                  }
                  onChange={(e) =>
                    onUpdate?.({ patient_instruction: e.target.value })
                  }
                  disabled={disabled}
                  placeholder={t("enter_patient_instructions")}
                />
              </div>

              <div className="space-y-2">
                <Label>{t("note")}</Label>
                <Textarea
                  value={serviceRequest.service_request.note || ""}
                  onChange={(e) => onUpdate?.({ note: e.target.value })}
                  disabled={disabled}
                  placeholder={t("add_notes")}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>{t("locations")}</Label>
                <RequirementsSelector
                  value={serviceRequest.service_request.locations || []}
                  onChange={(values) =>
                    onUpdate?.({
                      locations: values as unknown as LocationList[],
                    })
                  }
                  options={
                    locations?.results.map((location: LocationList) => ({
                      label: location.name,
                      value: location.id,
                      details: [
                        {
                          label: t("type"),
                          value: t(`location_form__${location.form}`),
                        },
                        { label: t("status"), value: t(location.status) },
                        {
                          label: t("description"),
                          value: location.description || undefined,
                        },
                      ],
                    })) || []
                  }
                  isLoading={isLoadingLocations}
                  placeholder={t("select_locations")}
                  onSearch={setLocationSearch}
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function ServiceRequestQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  facilityId,
  encounterId,
  errors,
}: ServiceRequestQuestionProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedActivityDefinition, setSelectedActivityDefinition] = useState<
    string | null
  >(null);
  const [previewServiceRequest, setPreviewServiceRequest] =
    useState<ServiceRequestApplyActivityDefinitionSpec | null>(null);
  const [serviceRequests, setServiceRequests] = useState<
    ServiceRequestApplyActivityDefinitionSpec[]
  >(
    (questionnaireResponse.values?.[0]
      ?.value as unknown as ServiceRequestApplyActivityDefinitionSpec[]) || [],
  );

  const { data: activityDefinitions } = useQuery({
    queryKey: ["activity_definitions"],
    queryFn: query(activityDefinitionApi.listActivityDefinition, {
      pathParams: { facilityId: facilityId },
      queryParams: { limit: 100 },
    }),
  });

  const {
    data: selectedActivityDefinitionData,
    isLoading: isLoadingSelectedAD,
  } = useQuery({
    queryKey: ["activity_definition", selectedActivityDefinition],
    queryFn: query(activityDefinitionApi.retrieveActivityDefinition, {
      pathParams: {
        facilityId: facilityId,
        activityDefinitionId: selectedActivityDefinition || "",
      },
    }),
    enabled: !!selectedActivityDefinition,
  });

  useEffect(() => {
    if (selectedActivityDefinition && selectedActivityDefinitionData) {
      const selectedAD = activityDefinitions?.results.find(
        (ad) => ad.id === selectedActivityDefinition,
      );
      if (!selectedAD) return;

      const newServiceRequest: ServiceRequestApplyActivityDefinitionSpec = {
        service_request: {
          title: selectedAD.title,
          status: Status.active,
          intent: Intent.order,
          priority: Priority.routine,
          category: selectedAD.category,
          do_not_perform: false,
          note: null,
          code: selectedAD.code,
          body_site: selectedAD.body_site,
          occurance: null,
          patient_instruction: null,
          locations:
            selectedActivityDefinitionData.locations?.map(
              (location) => location.id,
            ) || [],
        },
        activity_definition: selectedActivityDefinition,
        encounter: encounterId,
      };

      setPreviewServiceRequest(newServiceRequest);
      setOpen(false);
    }
  }, [
    selectedActivityDefinition,
    selectedActivityDefinitionData,
    activityDefinitions,
    encounterId,
  ]);

  const handleAddServiceRequest = () => {
    if (!previewServiceRequest) return;

    setServiceRequests([...serviceRequests, previewServiceRequest]);
    updateQuestionnaireResponseCB(
      [
        {
          type: "service_request",
          value: [...serviceRequests, previewServiceRequest],
        },
      ],
      questionnaireResponse.question_id,
    );
    setPreviewServiceRequest(null);
    setSelectedActivityDefinition(null);
  };

  const handleRemoveServiceRequest = (index: number) => {
    const newServiceRequests = serviceRequests.filter(
      (_, i: number) => i !== index,
    );
    setServiceRequests(newServiceRequests);
    updateQuestionnaireResponseCB(
      [{ type: "service_request", value: newServiceRequests }],
      questionnaireResponse.question_id,
    );
  };

  const handleUpdateServiceRequest = (
    index: number,
    updates: Partial<ServiceRequestReadSpec>,
  ) => {
    const newServiceRequests = serviceRequests.map(
      (sr: ServiceRequestApplyActivityDefinitionSpec, i: number) =>
        i === index
          ? {
              ...sr,
              service_request: {
                ...sr.service_request,
                ...updates,
                locations:
                  (updates.locations as unknown as string[]) ||
                  sr.service_request.locations ||
                  [],
              },
            }
          : sr,
    ) as ServiceRequestApplyActivityDefinitionSpec[];
    setServiceRequests(newServiceRequests);
    updateQuestionnaireResponseCB(
      [{ type: "service_request", value: newServiceRequests }],
      questionnaireResponse.question_id,
    );
  };

  const handleActivityDefinitionSelect = (activityDefinitionId: string) => {
    setSelectedActivityDefinition(activityDefinitionId);
  };

  return (
    <div className="space-y-4">
      {serviceRequests.map((serviceRequest, index) => (
        <ServiceRequestForm
          facilityId={facilityId}
          key={serviceRequest.service_request.code.code}
          serviceRequest={serviceRequest}
          onUpdate={(updates) => handleUpdateServiceRequest(index, updates)}
          onRemove={() => handleRemoveServiceRequest(index)}
          disabled={disabled}
          errors={errors}
          questionId={questionnaireResponse.question_id}
          index={index}
        />
      ))}

      {isLoadingSelectedAD && (
        <div className="rounded-md border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[150px]" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      )}

      {previewServiceRequest && !isLoadingSelectedAD && (
        <ServiceRequestForm
          facilityId={facilityId}
          serviceRequest={previewServiceRequest}
          onUpdate={() => handleAddServiceRequest()}
          onRemove={() => {
            setPreviewServiceRequest(null);
            setSelectedActivityDefinition(null);
          }}
          disabled={disabled}
          isPreview
        />
      )}

      <div className="space-y-2 w-full">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={disabled}
            >
              {selectedActivityDefinition
                ? activityDefinitions?.results.find(
                    (ad) => ad.id === selectedActivityDefinition,
                  )?.title
                : t("select_activity_definition")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput
                placeholder={t("search_activity_definitions")}
                className="h-9"
              />
              <CommandEmpty>{t("no_activity_definitions_found")}</CommandEmpty>
              <CommandGroup>
                {activityDefinitions?.results.map((ad) => (
                  <CommandItem
                    key={ad.id}
                    value={ad.id}
                    onSelect={() => {
                      setSelectedActivityDefinition(ad.id);
                      handleActivityDefinitionSelect(ad.id);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedActivityDefinition === ad.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {ad.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
