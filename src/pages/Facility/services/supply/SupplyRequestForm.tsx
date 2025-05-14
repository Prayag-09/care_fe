import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusCircle, Trash2 } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import Autocomplete from "@/components/ui/autocomplete";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";
import {
  SupplyRequestCategory,
  SupplyRequestIntent,
  SupplyRequestPriority,
  SupplyRequestReason,
  SupplyRequestStatus,
} from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import locationApi from "@/types/location/locationApi";

const supplyRequestSchema = z.object({
  status: z.nativeEnum(SupplyRequestStatus),
  intent: z.nativeEnum(SupplyRequestIntent),
  category: z.nativeEnum(SupplyRequestCategory),
  priority: z.nativeEnum(SupplyRequestPriority),
  reason: z.nativeEnum(SupplyRequestReason),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  deliver_from: z.string().optional(),
  deliver_to: z.string().min(1, "Delivery location is required"),
  item: z.string().min(1, "Item is required"),
});

const formSchema = z.object({
  requests: z
    .array(supplyRequestSchema)
    .min(1, "At least one request is required"),
});

interface Props {
  facilityId: string;
  locationId: string;
  supplyRequestId?: string;
}

export default function SupplyRequestForm({
  facilityId,
  locationId,
  supplyRequestId,
}: Props) {
  const { t } = useTranslation();
  const isEditMode = Boolean(supplyRequestId);

  const { data: existingData, isFetching } = useQuery({
    queryKey: ["supplyRequest", supplyRequestId],
    queryFn: query(supplyRequestApi.retrieveSupplyRequest, {
      pathParams: { supplyRequestId: supplyRequestId! },
    }),
    enabled: isEditMode,
  });

  if (isEditMode && isFetching) {
    return (
      <Page title={t("edit_supply_request")} hideTitleOnPage>
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("edit_supply_request")}
            </h1>
          </div>
          <FormSkeleton rows={10} />
        </div>
      </Page>
    );
  }

  return (
    <SupplyRequestFormContent
      facilityId={facilityId}
      supplyRequestId={supplyRequestId}
      existingData={existingData}
      locationId={locationId}
    />
  );
}

function SupplyRequestFormContent({
  facilityId,
  locationId,
  supplyRequestId,
  existingData,
}: {
  facilityId: string;
  supplyRequestId?: string;
  existingData?: any;
  locationId: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(supplyRequestId);
  const [searchDeliveryFrom, setSearchDeliveryFrom] = useState("");
  const [searchItem, setSearchItem] = useState("");

  const {
    data: deliveryFromLocations,
    isLoading: isLoadingDeliveryFromLocations,
  } = useQuery({
    queryKey: ["locations", facilityId, searchDeliveryFrom],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { search: searchDeliveryFrom, limit: 100 },
    }),
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["productKnowledge", facilityId, searchItem],
    queryFn: query.debounced(productKnowledgeApi.listProductKnowledge, {
      queryParams: { facility: facilityId, search: searchItem },
    }),
  });

  const deliveryFromOptions =
    deliveryFromLocations?.results.map((location) => ({
      label: location.name,
      value: location.id,
    })) || [];

  const productOptions =
    products?.results.map((product) => ({
      label: product.name,
      value: product.id,
    })) || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues:
      isEditMode && existingData
        ? {
            requests: [
              {
                status: existingData.status,
                intent: existingData.intent,
                category: existingData.category,
                priority: existingData.priority,
                reason: existingData.reason,
                quantity: existingData.quantity,
                deliver_from: existingData.deliver_from?.id,
                deliver_to: locationId, // Auto-set current location
                item: existingData.item.id,
              },
            ],
          }
        : {
            requests: [
              {
                status: SupplyRequestStatus.active,
                intent: SupplyRequestIntent.order,
                category: SupplyRequestCategory.central,
                priority: SupplyRequestPriority.routine,
                reason: SupplyRequestReason.ward_stock,
                quantity: 1,
                deliver_to: locationId, // Auto-set current location
              },
            ],
          },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "requests",
  });

  const { mutate: executeBatch, isPending } = useMutation({
    mutationFn: mutate(routes.batchRequest, { silent: true }),
    onSuccess: () => {
      toast.success(
        isEditMode ? t("supply_request_updated") : t("supply_requests_created"),
      );
      queryClient.invalidateQueries({ queryKey: ["supplyRequests"] });
      navigate(
        `/facility/${facilityId}/locations/${locationId}/supply_requests`,
      );
    },
    onError: (error) => {
      const errorData = error.cause as {
        results?: Array<{
          reference_id: string;
          status_code: number;
          data: {
            errors?: Array<{
              msg?: string;
              error?: string;
              type?: string;
              loc?: string[];
            }>;
            non_field_errors?: string[];
            detail?: string;
          };
        }>;
      };

      if (errorData?.results) {
        const failedResults = errorData.results.filter(
          (result) => result.status_code !== 200,
        );

        let errorDisplayed = false;
        failedResults.forEach((result) => {
          const errors = result.data?.errors || [];
          const nonFieldErrors = result.data?.non_field_errors || [];
          const detailError = result.data?.detail;

          errors.forEach((error) => {
            const message = error.msg || error.error || t("validation_failed");
            toast.error(message);
            errorDisplayed = true;
          });

          nonFieldErrors.forEach((message) => {
            toast.error(message);
            errorDisplayed = true;
          });

          if (detailError) {
            toast.error(detailError);
            errorDisplayed = true;
          }
        });

        if (failedResults.length > 0 && !errorDisplayed) {
          toast.error(t("error_updating_supply_request"));
        }
      } else {
        toast.error(t("error_updating_supply_request"));
      }
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (isEditMode) {
      executeBatch({
        requests: [
          {
            url: `/api/v1/supply_request/${supplyRequestId}/`,
            method: "PUT",
            reference_id: "update_supply_request",
            body: data.requests[0],
          },
        ],
      });
    } else {
      executeBatch({
        requests: data.requests.map((request, index) => ({
          url: "/api/v1/supply_request/",
          method: "POST",
          reference_id: `create_supply_request_${index}`,
          body: request,
        })),
      });
    }
  }

  return (
    <Page
      title={isEditMode ? t("edit_supply_request") : t("create_supply_request")}
      hideTitleOnPage
    >
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditMode ? t("edit_supply_request") : t("create_supply_request")}
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("request_details")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requests.0.status"
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
                            {Object.values(SupplyRequestStatus).map(
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

                  <FormField
                    control={form.control}
                    name="requests.0.priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("priority")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_priority")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(SupplyRequestPriority).map(
                              (priority) => (
                                <SelectItem key={priority} value={priority}>
                                  {t(priority)}
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requests.0.category"
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
                            {Object.values(SupplyRequestCategory).map(
                              (category) => (
                                <SelectItem key={category} value={category}>
                                  {t(category)}
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
                    name="requests.0.reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("reason")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t("select_reason")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(SupplyRequestReason).map(
                              (reason) => (
                                <SelectItem key={reason} value={reason}>
                                  {t(reason)}
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

                <FormField
                  control={form.control}
                  name="requests.0.deliver_from"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("deliver_from")}</FormLabel>
                      <FormControl>
                        <Autocomplete
                          options={deliveryFromOptions}
                          value={field.value || ""}
                          onChange={field.onChange}
                          isLoading={isLoadingDeliveryFromLocations}
                          onSearch={setSearchDeliveryFrom}
                          placeholder={t("select_location")}
                          inputPlaceholder={t("search_location")}
                          noOptionsMessage={t("no_locations_found")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("items")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("item")}</TableHead>
                      <TableHead>{t("quantity")}</TableHead>
                      {!isEditMode && (
                        <TableHead className="w-[100px]">
                          {t("actions")}
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`requests.${index}.item`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Autocomplete
                                    options={productOptions}
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    isLoading={isLoadingProducts}
                                    onSearch={setSearchItem}
                                    placeholder={t("select_product")}
                                    inputPlaceholder={t("search_product")}
                                    noOptionsMessage={t("no_products_found")}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`requests.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(parseInt(e.target.value))
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        {!isEditMode && (
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {!isEditMode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      append({
                        status: form.getValues("requests.0.status"),
                        intent: form.getValues("requests.0.intent"),
                        category: form.getValues("requests.0.category"),
                        priority: form.getValues("requests.0.priority"),
                        reason: form.getValues("requests.0.reason"),
                        deliver_from: form.getValues("requests.0.deliver_from"),
                        deliver_to: locationId,
                        quantity: 1,
                        item: "",
                      })
                    }
                    className="mt-4"
                  >
                    <PlusCircle className="mr-2 size-4" />
                    {t("add_another_item")}
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/locations/${locationId}/supply_requests`,
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
