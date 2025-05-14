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
import ProductApi from "@/types/inventory/product/ProductApi";
import {
  SupplyDeliveryCondition,
  SupplyDeliveryStatus,
  SupplyDeliveryType,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import locationApi from "@/types/location/locationApi";

const supplyDeliverySchema = z.object({
  status: z.nativeEnum(SupplyDeliveryStatus),
  supplied_item_type: z.nativeEnum(SupplyDeliveryType),
  supplied_item_condition: z.nativeEnum(SupplyDeliveryCondition).optional(),
  supplied_item_quantity: z.number().min(1, "Quantity must be at least 1"),
  supplied_item: z.string().min(1, "Item is required"),
  origin: z.string().optional(),
  destination: z.string().min(1, "Destination is required"),
});

const formSchema = z.object({
  deliveries: z
    .array(supplyDeliverySchema)
    .min(1, "At least one delivery is required"),
});

interface Props {
  facilityId: string;
  locationId: string;
  supplyDeliveryId?: string;
}

function SupplyDeliveryFormContent({
  facilityId,
  locationId,
  supplyDeliveryId,
  existingData,
}: {
  facilityId: string;
  supplyDeliveryId?: string;
  existingData?: any;
  locationId: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(supplyDeliveryId);
  const [searchDeliveryTo, setSearchDeliveryTo] = useState("");
  const [searchItem, setSearchItem] = useState("");

  const { data: deliveryToLocations, isLoading: isLoadingDeliveryToLocations } =
    useQuery({
      queryKey: ["locations", facilityId, searchDeliveryTo],
      queryFn: query.debounced(locationApi.list, {
        pathParams: { facility_id: facilityId },
        queryParams: { search: searchDeliveryTo, limit: 100 },
      }),
    });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["product", facilityId, searchItem],
    queryFn: query.debounced(ProductApi.listProduct, {
      pathParams: { facilityId },
      queryParams: { search: searchItem },
    }),
  });

  const deliveryToOptions =
    deliveryToLocations?.results.map((location) => ({
      label: location.name,
      value: location.id,
    })) || [];

  const productOptions =
    products?.results.map((product) => ({
      label: `${product.product_knowledge.name} (Lot #${product.batch?.lot_number})`,
      value: product.id,
    })) || [];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues:
      isEditMode && existingData
        ? {
            deliveries: [
              {
                status: existingData.status,
                supplied_item_type: existingData.supplied_item_type,
                supplied_item_condition: existingData.supplied_item_condition,
                supplied_item_quantity: existingData.supplied_item_quantity,
                supplied_item: existingData.supplied_item.id,
                origin: locationId,
                destination: existingData.destination.id,
              },
            ],
          }
        : {
            deliveries: [
              {
                status: SupplyDeliveryStatus.in_progress,
                supplied_item_type: SupplyDeliveryType.product,
                supplied_item_quantity: 1,
                origin: locationId,
              },
            ],
          },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "deliveries",
  });

  const { mutate: executeBatch, isPending } = useMutation({
    mutationFn: mutate(routes.batchRequest, { silent: true }),
    onSuccess: () => {
      toast.success(
        isEditMode
          ? t("supply_delivery_updated")
          : t("supply_deliveries_created"),
      );
      queryClient.invalidateQueries({ queryKey: ["supplyDeliveries"] });
      navigate(
        `/facility/${facilityId}/locations/${locationId}/supply_deliveries`,
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
          toast.error(t("error_updating_supply_delivery"));
        }
      } else {
        toast.error(t("error_updating_supply_delivery"));
      }
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (isEditMode) {
      executeBatch({
        requests: [
          {
            url: `/api/v1/supply_delivery/${supplyDeliveryId}/`,
            method: "PUT",
            reference_id: "update_supply_delivery",
            body: data.deliveries[0],
          },
        ],
      });
    } else {
      executeBatch({
        requests: data.deliveries.map((delivery, index) => ({
          url: "/api/v1/supply_delivery/",
          method: "POST",
          reference_id: `create_supply_delivery_${index}`,
          body: delivery,
        })),
      });
    }
  }

  return (
    <Page
      title={
        isEditMode ? t("edit_supply_delivery") : t("create_supply_delivery")
      }
      hideTitleOnPage
    >
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditMode
              ? t("edit_supply_delivery")
              : t("create_supply_delivery")}
          </h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("delivery_details")}</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deliveries.0.status"
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
                          {Object.values(SupplyDeliveryStatus).map((status) => (
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
                  name="deliveries.0.supplied_item_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("type")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_type")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(SupplyDeliveryType).map((type) => (
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

                <FormField
                  control={form.control}
                  name="deliveries.0.supplied_item_condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("condition")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("select_condition")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(SupplyDeliveryCondition).map(
                            (condition) => (
                              <SelectItem key={condition} value={condition}>
                                {t(condition)}
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
                  name="deliveries.0.destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("destination")}</FormLabel>
                      <FormControl>
                        <Autocomplete
                          options={deliveryToOptions}
                          value={field.value || ""}
                          onChange={field.onChange}
                          isLoading={isLoadingDeliveryToLocations}
                          onSearch={setSearchDeliveryTo}
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
                            name={`deliveries.${index}.supplied_item`}
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
                            name={`deliveries.${index}.supplied_item_quantity`}
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
                        status: form.getValues("deliveries.0.status"),
                        supplied_item_type: form.getValues(
                          "deliveries.0.supplied_item_type",
                        ),
                        supplied_item_condition: form.getValues(
                          "deliveries.0.supplied_item_condition",
                        ),
                        origin: locationId,
                        destination: form.getValues("deliveries.0.destination"),
                        supplied_item_quantity: 1,
                        supplied_item: "",
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
                    `/facility/${facilityId}/locations/${locationId}/supply_deliveries`,
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

export default function SupplyDeliveryForm({
  facilityId,
  locationId,
  supplyDeliveryId,
}: Props) {
  const { t } = useTranslation();
  const isEditMode = Boolean(supplyDeliveryId);

  const { data: existingData, isFetching } = useQuery({
    queryKey: ["supplyDelivery", supplyDeliveryId],
    queryFn: query(supplyDeliveryApi.retrieveSupplyDelivery, {
      pathParams: { supplyDeliveryId: supplyDeliveryId! },
    }),
    enabled: isEditMode,
  });

  if (isEditMode && isFetching) {
    return (
      <Page title={t("edit_supply_delivery")} hideTitleOnPage>
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("edit_supply_delivery")}
            </h1>
          </div>
          <FormSkeleton rows={10} />
        </div>
      </Page>
    );
  }

  return (
    <SupplyDeliveryFormContent
      facilityId={facilityId}
      supplyDeliveryId={supplyDeliveryId}
      existingData={existingData}
      locationId={locationId}
    />
  );
}
