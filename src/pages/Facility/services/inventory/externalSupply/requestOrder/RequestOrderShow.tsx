import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, X } from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import Page from "@/components/Common/Page";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupplyDeliveryTable } from "@/pages/Facility/services/inventory/SupplyDeliveryTable";

import DeliveryOrderTable from "@/pages/Facility/services/inventory/externalSupply/components/DeliveryOrderTable";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { AddItemsForm } from "./AddItemsForm";

import {
  REQUEST_ORDER_PRIORITY_COLORS,
  REQUEST_ORDER_STATUS_COLORS,
  RequestOrderStatus,
} from "@/types/inventory/requestOrder/requestOrder";
import requestOrderApi from "@/types/inventory/requestOrder/requestOrderApi";
import { SupplyDeliveryStatus } from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { SUPPLY_REQUEST_STATUS_COLORS } from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface Props {
  facilityId: string;
  requestOrderId: string;
  internal: boolean;
  locationId: string;
}

export function RequestOrderShow({
  facilityId,
  requestOrderId,
  internal,
  locationId,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedProductKnowledge, setSelectedProductKnowledge] =
    useState<ProductKnowledgeBase>();

  const { data: requestOrder, isLoading } = useQuery({
    queryKey: ["requestOrders", requestOrderId],
    queryFn: query(requestOrderApi.retrieveRequestOrder, {
      pathParams: {
        facilityId: facilityId,
        requestOrderId: requestOrderId,
      },
    }),
  });

  const { data: supplyRequests, isLoading: isLoadingSupplyRequests } = useQuery(
    {
      queryKey: ["supplyRequests", requestOrderId],
      queryFn: query(supplyRequestApi.listSupplyRequest, {
        queryParams: {
          order: requestOrderId,
        },
      }),
      enabled: !!requestOrderId,
    },
  );

  const { data: deliveryOrders, isLoading: isLoadingDeliveryOrders } = useQuery(
    {
      queryKey: ["deliveryOrders", requestOrderId],
      queryFn: query(supplyDeliveryApi.deliveryOrders, {
        queryParams: {
          request_order: requestOrderId,
          status: [SupplyDeliveryStatus.completed],
        },
      }),
      enabled: !!requestOrderId,
    },
  );

  // Query for all supply deliveries related to this request order
  const { data: allSupplyDeliveries, isLoading: isLoadingAllSupplyDeliveries } =
    useQuery({
      queryKey: [
        "allSupplyDeliveries",
        requestOrderId,
        selectedProductKnowledge?.id,
      ],
      queryFn: query(supplyDeliveryApi.listSupplyDelivery, {
        queryParams: {
          facility: facilityId,
          request_order: requestOrderId,
          ...(internal
            ? {
                supplied_inventory_item_product_knowledge:
                  selectedProductKnowledge?.id,
              }
            : {
                supplied_item_product_knowledge: selectedProductKnowledge?.id,
              }),
        },
      }),
      enabled: !!requestOrderId,
    });

  const { mutate: approveOrder, isPending: isApproving } = useMutation({
    mutationFn: mutate(requestOrderApi.updateRequestOrder, {
      pathParams: {
        facilityId: facilityId,
        requestOrderId: requestOrderId,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["requestOrders", requestOrderId],
      });
      toast.success(t("order_approved_successfully"));
    },
    onError: (_error) => {
      toast.error(t("error_approving_order"));
    },
  });

  function handleSupplyRequestSuccess() {
    queryClient.invalidateQueries({
      queryKey: ["supplyRequests", requestOrderId],
    });
  }

  function handleApproveOrder() {
    if (!requestOrder) return;

    approveOrder({
      ...requestOrder,
      status: RequestOrderStatus.pending,
      supplier: requestOrder.supplier?.id || "",
      origin: requestOrder.origin?.id || undefined,
      destination: requestOrder.destination.id,
    });
  }

  if (isLoading) {
    return (
      <Page title={t("request_order_details")} hideTitleOnPage>
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </Page>
    );
  }

  if (!requestOrder) {
    return (
      <Page title={t("request_order_details")} hideTitleOnPage>
        <div className="space-y-4">
          <div className="text-center py-8">
            <p className="text-gray-500">{t("request_order_not_found")}</p>
          </div>
        </div>
      </Page>
    );
  }

  const isRequester = requestOrder?.destination.id === locationId;

  const canAddSupplyRequests = requestOrder.status === RequestOrderStatus.draft;

  return (
    <Page
      title={t("request_order_details")}
      hideTitleOnPage
      shortCutContext="facility:inventory"
    >
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("back")}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`${requestOrderId}/edit`}>{t("edit")}</Link>
            </Button>
            {canAddSupplyRequests && (
              <Button onClick={handleApproveOrder} disabled={isApproving}>
                {isApproving ? t("approving") : t("approve_order")}
              </Button>
            )}
            {((internal && !isRequester) ||
              (!internal &&
                requestOrder.status === RequestOrderStatus.pending)) && (
              <Button variant="outline" asChild>
                <Link
                  href={`/${internal ? "internal_transfers" : "external_supply"}/delivery_orders/new?supplyOrder=${requestOrderId}`}
                >
                  {t("create_supply_delivery")}
                  <ShortcutBadge actionId="create-order" />
                </Link>
              </Button>
            )}
          </div>
        </div>
        {/* Request Order Details */}
        <Card>
          <CardHeader>
            <div className="flex md:flex-row flex-col justify-between">
              <CardTitle className="text-xl">{requestOrder.name}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={REQUEST_ORDER_STATUS_COLORS[requestOrder.status]}
                >
                  {t(requestOrder.status)}
                </Badge>
                <Badge
                  variant={REQUEST_ORDER_PRIORITY_COLORS[requestOrder.priority]}
                >
                  {t(requestOrder.priority)}
                </Badge>
                <Badge>{t(requestOrder.category)}</Badge>
                <Badge>{t(requestOrder.reason)}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {requestOrder.note && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {t("notes")}
                </label>
                <p className="text-sm">{requestOrder.note}</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  {t("destination")}
                </label>
                <p className="text-sm">{requestOrder.destination.name}</p>
              </div>
              {requestOrder.supplier && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {t("supplier")}
                  </label>
                  <p className="text-sm">{requestOrder.supplier.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Supply Requests and Deliveries Tabs */}
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="supply-requests" className="w-full">
              <div className="border-b bg-gray-50/50 px-6 pt-2 pb-1">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 shadow-md">
                  <TabsTrigger
                    value="supply-requests"
                    className="data-[state=active]:bg-white data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      {t("supply_requests")}
                      {supplyRequests?.results &&
                        supplyRequests.results.length > 0 && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {supplyRequests.results.length}
                          </Badge>
                        )}
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="supply-deliveries"
                    className="data-[state=active]:bg-white data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      {t("supply_deliveries")}
                      {deliveryOrders?.results &&
                        deliveryOrders.results.length > 0 && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {deliveryOrders.results.length}
                          </Badge>
                        )}
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="all-deliveries"
                    className="data-[state=active]:bg-white data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      {t("all_deliveries")}
                      {allSupplyDeliveries?.results &&
                        allSupplyDeliveries.results.length > 0 && (
                          <Badge variant="secondary" className="ml-1 text-xs">
                            {allSupplyDeliveries.results.length}
                          </Badge>
                        )}
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="supply-requests"
                className="px-6 py-4 space-y-6"
              >
                {isLoadingSupplyRequests ? (
                  <div className="space-y-4">
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-16 bg-gray-200 rounded"
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Supply Requests Table */}
                    {supplyRequests?.results &&
                    supplyRequests.results.length > 0 ? (
                      <div className="space-y-4">
                        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
                          <Table>
                            <TableHeader className="bg-gray-50">
                              <TableRow>
                                <TableHead className="font-semibold text-gray-700">
                                  {t("item")}
                                </TableHead>
                                <TableHead className="font-semibold text-gray-700">
                                  {t("quantity")}
                                </TableHead>
                                <TableHead className="font-semibold text-gray-700">
                                  {t("status")}
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {supplyRequests.results.map((supplyRequest) => (
                                <TableRow
                                  key={supplyRequest.id}
                                  className="hover:bg-gray-50/50"
                                >
                                  <TableCell className="font-medium">
                                    {supplyRequest.item.name}
                                  </TableCell>
                                  <TableCell>
                                    <span className="font-semibold text-gray-900">
                                      {supplyRequest.quantity}
                                    </span>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        SUPPLY_REQUEST_STATUS_COLORS[
                                          supplyRequest.status
                                        ]
                                      }
                                      className="font-medium"
                                    >
                                      {t(supplyRequest.status)}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <div className="w-6 h-6 bg-gray-300 rounded"></div>
                        </div>
                        <p className="text-gray-500 font-medium">
                          {t("no_supply_requests_found")}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          {t("add_items_to_get_started")}
                        </p>
                      </div>
                    )}

                    {/* Add New Items Form - Always show when in draft mode */}
                    {canAddSupplyRequests && (
                      <div className="border-t pt-6">
                        <AddItemsForm
                          requestOrderId={requestOrderId}
                          onSuccess={handleSupplyRequestSuccess}
                        />
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="supply-deliveries" className="p-6">
                {isLoadingDeliveryOrders ? (
                  <div className="space-y-4">
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-16 bg-gray-200 rounded"
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : deliveryOrders?.results &&
                  deliveryOrders.results.length > 0 ? (
                  <DeliveryOrderTable
                    deliveries={deliveryOrders.results}
                    isLoading={false}
                    facilityId={facilityId}
                    locationId={requestOrder?.destination.id || ""}
                    internal={false}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <div className="w-6 h-6 bg-gray-300 rounded"></div>
                    </div>
                    <p className="text-gray-500 font-medium">
                      {t("no_supply_deliveries_found")}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {t("deliveries_will_appear_here")}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="all-deliveries" className="p-6">
                {isLoadingAllSupplyDeliveries ? (
                  <div className="space-y-4">
                    <div className="animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-16 bg-gray-200 rounded"
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-end">
                      <div>
                        <ProductKnowledgeSelect
                          value={selectedProductKnowledge}
                          onChange={(value) => {
                            setSelectedProductKnowledge(value);
                          }}
                          placeholder={t("filter_by_product")}
                        />
                      </div>
                      {selectedProductKnowledge && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setSelectedProductKnowledge(undefined);
                          }}
                        >
                          <X className="h-4 w-4" />
                          {t("clear")}
                        </Button>
                      )}
                    </div>
                    {allSupplyDeliveries?.results &&
                    allSupplyDeliveries.results.length > 0 ? (
                      <SupplyDeliveryTable
                        deliveries={allSupplyDeliveries.results}
                        internal={internal}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <div className="w-6 h-6 bg-gray-300 rounded"></div>
                        </div>
                        <p className="text-gray-500 font-medium">
                          {t("no_deliveries_found")}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                          {t("deliveries_will_appear_here")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
