import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MoreVertical, PlusIcon, X } from "lucide-react";
import { useNavigate } from "raviger";
import { useEffect, useState } from "react";
import React from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";

import useAppHistory from "@/hooks/useAppHistory";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";
import {
  SupplyRequestCategory,
  SupplyRequestIntent,
  SupplyRequestPriority,
  SupplyRequestRead,
  SupplyRequestReason,
  SupplyRequestStatus,
} from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface Props {
  facilityId: string;
  locationId: string;
  supplyRequestId?: string;
}

const supplyRequestItemSchema = z.object({
  item: z.string().min(1, "Item is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

const formSchema = z.object({
  status: z.nativeEnum(SupplyRequestStatus),
  intent: z.nativeEnum(SupplyRequestIntent),
  category: z.nativeEnum(SupplyRequestCategory),
  priority: z.nativeEnum(SupplyRequestPriority),
  reason: z.nativeEnum(SupplyRequestReason),
  deliver_from: z.string().min(1, "Please select a location to deliver from"),
  deliver_to: z.string(),
  requests: z
    .array(supplyRequestItemSchema)
    .min(1, "At least one request is required"),
});

export default function RaiseStockRequest({
  facilityId,
  locationId,
  supplyRequestId,
}: Props) {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
  const navigate = useNavigate();
  const [searchDeliveryFrom, setSearchDeliveryFrom] = useState("");
  const [searchItem, setSearchItem] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, ProductKnowledgeBase>
  >({});

  const {
    data: deliveryFromLocations,
    isLoading: isLoadingDeliveryFromLocations,
  } = useQuery({
    queryKey: ["locations", facilityId, searchDeliveryFrom],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { search: searchDeliveryFrom, limit: 100 },
    }),
    select: (data: PaginatedResponse<LocationList>) => {
      // Filter out the current location
      return data.results.filter((location) => location.id !== locationId);
    },
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["productKnowledge", facilityId, searchItem],
    queryFn: query.debounced(productKnowledgeApi.listProductKnowledge, {
      queryParams: {
        facility: facilityId,
        search: searchItem,
        status: "active",
      },
    }),
  });

  // Fetch existing supply request data if editing
  const { data: existingSupplyRequest } = useQuery({
    queryKey: ["supplyRequest", supplyRequestId],
    queryFn: query(supplyRequestApi.retrieveSupplyRequest, {
      pathParams: { supplyRequestId: supplyRequestId! },
    }),
    enabled: !!supplyRequestId,
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: SupplyRequestStatus.active,
      intent: SupplyRequestIntent.order,
      category: SupplyRequestCategory.central,
      priority: SupplyRequestPriority.routine,
      reason: SupplyRequestReason.ward_stock,
      deliver_to: locationId,
      deliver_from: "",
      requests: [{ quantity: null as unknown as number, item: "" }],
    },
  });

  // Update form with existing data when fetched
  useEffect(() => {
    if (existingSupplyRequest) {
      const supplyRequest = existingSupplyRequest as SupplyRequestRead;
      form.reset({
        status: supplyRequest.status,
        intent: supplyRequest.intent,
        category: supplyRequest.category,
        priority: supplyRequest.priority,
        reason: supplyRequest.reason,
        deliver_to: supplyRequest.deliver_to.id,
        deliver_from: supplyRequest.deliver_from?.id || "",
        requests: [
          {
            item: supplyRequest.item.id,
            quantity: supplyRequest.quantity,
          },
        ],
      });

      // Set selected products for display
      const productsMap: Record<string, ProductKnowledgeBase> = {};
      productsMap[supplyRequest.item.id] = supplyRequest.item;
      setSelectedProducts(productsMap);
    }
  }, [existingSupplyRequest, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "requests",
  });

  const { mutate: upsertSupplyRequest, isPending } = useMutation({
    mutationFn: mutate(supplyRequestApi.upsertSupplyRequest),
    onSuccess: () => {
      toast.success(t("supply_requests_created"));
      navigate("/internal_transfers/to_receive");
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    const { requests, ...commonData } = data;
    const datapoints = requests.map((request) => ({
      ...commonData,
      ...request,
      ...(supplyRequestId ? { id: supplyRequestId } : {}),
    }));
    upsertSupplyRequest({ datapoints });
  }

  const deliveryFromOptions =
    deliveryFromLocations?.map((location) => ({
      label: location.name,
      value: location.id,
    })) || [];

  const productOptions =
    products?.results.map((product) => ({
      label: product.name,
      value: product.id,
    })) || [];

  const isEditing = !!supplyRequestId;
  const pageTitle = isEditing
    ? t("edit_stock_request")
    : t("raise_stock_request");
  const pageDescription = t(
    "request_stock_from_another_store_or_pharmacy_within_the_facility",
  );

  return (
    <Page title={pageTitle} hideTitleOnPage>
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6 relative">
          <Button
            variant="outline"
            size="icon"
            className="absolute -right-2 -top-2"
            onClick={() => goBack()}
          >
            <X className="size-5" />
            <span className="sr-only">{t("close")}</span>
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">{pageTitle}</h1>
          <p className="mt-1 text-sm text-gray-600">{pageDescription}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Items to Request Section */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-900">
                  {t("items_to_request")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <Table className="bg-gray-50">
                    <TableHeader>
                      <TableRow className="bg-gray-100 border-b border-gray-300 rounded-t-lg">
                        <TableHead className="text-gray-800 w-[60%] border-r border-gray-300">
                          {t("select_item_from_lot")}
                        </TableHead>
                        <TableHead className="text-gray-800 w-[25%] border-r border-gray-300">
                          {t("quantity")}
                        </TableHead>
                        <TableHead className="text-gray-800 w-[5%] text-center">
                          {t("action")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow
                          key={field.id}
                          className="border-b border-gray-300 last:border-b-0"
                        >
                          <TableCell className="min-w-[300px] border-r border-gray-300">
                            <FormField
                              control={form.control}
                              name={`requests.${index}.item`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Autocomplete
                                      options={productOptions}
                                      value={field.value}
                                      onChange={(value) => {
                                        const selectedProduct =
                                          products?.results.find(
                                            (p) => p.id === value,
                                          );
                                        if (selectedProduct) {
                                          setSelectedProducts((prev) => ({
                                            ...prev,
                                            [value]: selectedProduct,
                                          }));
                                        }
                                        field.onChange(value);
                                      }}
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
                          <TableCell className="border-r border-gray-300">
                            <FormField
                              control={form.control}
                              name={`requests.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <div className="relative flex items-center max-w-[200px]">
                                      <Input
                                        type="number"
                                        min={1}
                                        placeholder={t("quantity")}
                                        className="h-10 rounded-md border border-gray-200 bg-white px-3 text-base focus:border-primary-600 focus:ring-2 focus:ring-primary-100 pr-16"
                                        {...field}
                                        onChange={(e) =>
                                          field.onChange(
                                            parseInt(e.target.value),
                                          )
                                        }
                                      />
                                      <span className="absolute right-3 text-sm text-gray-500">
                                        {form.watch(`requests.${index}.item`) &&
                                          selectedProducts[
                                            form.watch(`requests.${index}.item`)
                                          ]?.definitional?.dosage_form?.display}
                                      </span>
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-gray-400 hover:bg-gray-100"
                                >
                                  <span className="sr-only">
                                    {t("actions")}
                                  </span>
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => remove(index)}
                                  disabled={fields.length === 1}
                                  className={
                                    fields.length === 1
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }
                                >
                                  {t("remove")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-md border border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                    onClick={() => append({ quantity: 1, item: "" })}
                  >
                    <PlusIcon className="w-4 h-4" /> {t("add_another_item")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Request Details Section */}
            <Card className="bg-white border border-gray-200 rounded-xl shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold text-gray-900">
                  {t("request_details")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <FormLabel className="text-sm font-medium text-gray-900 mb-2 block">
                    {t("status")}
                  </FormLabel>
                  <RadioGroup
                    value={form.watch("status")}
                    onValueChange={(value) =>
                      form.setValue("status", value as SupplyRequestStatus)
                    }
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={SupplyRequestStatus.active}
                        id="active"
                        className="w-5 h-5 border-2 border-primary-600 data-[state=checked]:bg-primary-50 data-[state=checked]:border-primary-600 data-[state=checked]:ring-2 data-[state=checked]:ring-primary-100"
                      />
                      <FormLabel
                        htmlFor="active"
                        className="text-base font-medium text-gray-900"
                      >
                        {t("active")}
                      </FormLabel>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={SupplyRequestStatus.draft}
                        id="draft"
                        className="w-5 h-5 border-2 border-gray-300 data-[state=checked]:bg-primary-50 data-[state=checked]:border-primary-600 data-[state=checked]:ring-2 data-[state=checked]:ring-primary-100"
                      />
                      <FormLabel
                        htmlFor="draft"
                        className="text-base font-medium text-gray-900"
                      >
                        {t("draft")}
                      </FormLabel>
                    </div>
                  </RadioGroup>
                </div>

                <div className="grid grid-cols-2 gap-16">
                  <div>
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-900 mb-2 block">
                            {t("priority")}
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="flex flex-col gap-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value={SupplyRequestPriority.routine}
                                  id="routine"
                                  className="w-5 h-5 border-2 border-primary-600 data-[state=checked]:bg-primary-50 data-[state=checked]:border-primary-600 data-[state=checked]:ring-2 data-[state=checked]:ring-primary-100"
                                />
                                <FormLabel
                                  htmlFor="routine"
                                  className="text-base font-medium text-gray-900"
                                >
                                  {t("routine")}
                                </FormLabel>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value={SupplyRequestPriority.urgent}
                                  id="urgent"
                                  className="w-5 h-5 border-2 border-gray-300 data-[state=checked]:bg-primary-50 data-[state=checked]:border-primary-600 data-[state=checked]:ring-2 data-[state=checked]:ring-primary-100"
                                />
                                <FormLabel
                                  htmlFor="urgent"
                                  className="text-base font-medium text-gray-900"
                                >
                                  {t("urgent")}
                                </FormLabel>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value={SupplyRequestPriority.asap}
                                  id="asap"
                                  className="w-5 h-5 border-2 border-gray-300 data-[state=checked]:bg-primary-50 data-[state=checked]:border-primary-600 data-[state=checked]:ring-2 data-[state=checked]:ring-primary-100"
                                />
                                <FormLabel
                                  htmlFor="asap"
                                  className="text-base font-medium text-gray-900"
                                >
                                  {t("asap")}
                                </FormLabel>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value={SupplyRequestPriority.stat}
                                  id="stat"
                                  className="w-5 h-5 border-2 border-gray-300 data-[state=checked]:bg-primary-50 data-[state=checked]:border-primary-600 data-[state=checked]:ring-2 data-[state=checked]:ring-primary-100"
                                />
                                <FormLabel
                                  htmlFor="stat"
                                  className="text-base font-medium text-gray-900"
                                >
                                  {t("stat")}
                                </FormLabel>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div>
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-900 mb-2 block">
                            {t("reason")}
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={field.onChange}
                              className="flex flex-col gap-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value={SupplyRequestReason.ward_stock}
                                  id="ward_stock"
                                  className="w-5 h-5 border-2 border-primary-600 data-[state=checked]:bg-primary-50 data-[state=checked]:border-primary-600 data-[state=checked]:ring-2 data-[state=checked]:ring-primary-100"
                                />
                                <FormLabel
                                  htmlFor="ward_stock"
                                  className="text-base font-medium text-gray-900"
                                >
                                  {t("ward_stock")}
                                </FormLabel>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                  value={SupplyRequestReason.patient_care}
                                  id="patient_care"
                                  className="w-5 h-5 border-2 border-gray-300 data-[state=checked]:bg-primary-50 data-[state=checked]:border-primary-600 data-[state=checked]:ring-2 data-[state=checked]:ring-primary-100"
                                />
                                <FormLabel
                                  htmlFor="patient_care"
                                  className="text-base font-medium text-gray-900"
                                >
                                  {t("patient_care")}
                                </FormLabel>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="deliver_from"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-900 mb-2 block">
                          {t("deliver_from")}
                        </FormLabel>
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
                </div>
              </CardContent>
            </Card>

            {/* Footer Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                className="rounded-md border border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
                onClick={() => navigate("/internal_transfers/to_receive")}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-primary-700 text-white hover:bg-primary-800"
              >
                {isPending
                  ? t("submitting")
                  : isEditing
                    ? t("update_request")
                    : t("submit_request")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Page>
  );
}
