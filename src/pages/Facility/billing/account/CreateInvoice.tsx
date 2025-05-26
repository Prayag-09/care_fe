import { zodResolver } from "@hookform/resolvers/zod";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

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
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import {
  ChargeItemRead,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import {
  InvoiceCreate,
  InvoiceRead,
  InvoiceStatus,
} from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";

const ITEMS_PER_PAGE = 10;

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  status: z.nativeEnum(InvoiceStatus),
  payment_terms: z.string().optional(),
  note: z.string().optional(),
  charge_items: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateInvoicePageProps {
  facilityId: string;
  accountId: string;
  preSelectedChargeItems?: ChargeItemRead[];
  redirectInNewTab?: boolean;
  onSuccess?: () => void;
}

interface PriceComponentRowProps {
  label: string;
  components: any[];
  totalPriceComponents: any[];
}

function PriceComponentRow({
  label,
  components,
  totalPriceComponents,
}: PriceComponentRowProps) {
  if (!components.length) return null;

  return (
    <>
      {components.map((component, index) => (
        <TableRow
          key={`${label}-${index}`}
          className="text-xs text-gray-500 bg-muted/30"
        >
          <TableCell></TableCell>
          <TableCell>
            {component.code && `${component.code.display} `}({label})
          </TableCell>
          <TableCell></TableCell>
          <TableCell>
            <MonetaryDisplay {...component} />
          </TableCell>
          <TableCell>
            {component.monetary_component_type ===
            MonetaryComponentType.discount
              ? "- "
              : "+ "}
            <MonetaryDisplay amount={totalPriceComponents[index]?.amount} />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function CreateInvoicePage({
  facilityId,
  accountId,
  preSelectedChargeItems,
  redirectInNewTab = false,
  onSuccess,
}: CreateInvoicePageProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>(
    () => {
      if (!preSelectedChargeItems) return {};
      return preSelectedChargeItems.reduce(
        (acc, item) => {
          acc[item.id] = true;
          return acc;
        },
        {} as Record<string, boolean>,
      );
    },
  );
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      status: InvoiceStatus.draft,
      payment_terms: "",
      note: "",
      charge_items: preSelectedChargeItems?.map((item) => item.id) || [],
    },
  });

  const {
    data: chargeItemsData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["chargeItems", facilityId, accountId],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await query(chargeItemApi.listChargeItem, {
        pathParams: { facilityId },
        queryParams: {
          limit: String(ITEMS_PER_PAGE),
          offset: String(pageParam),
          status: ChargeItemStatus.billable,
          account: accountId,
        },
      })({ signal: new AbortController().signal });
      return response as PaginatedResponse<ChargeItemRead>;
    },
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: PaginatedResponse<ChargeItemRead>,
      allPages: PaginatedResponse<ChargeItemRead>[],
    ) => {
      const currentOffset = allPages.length * ITEMS_PER_PAGE;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    enabled: !!facilityId && !!accountId && !preSelectedChargeItems,
  });

  const createMutation = useMutation({
    mutationFn: mutate(invoiceApi.createInvoice, {
      pathParams: { facilityId },
    }),
    onSuccess: (invoice: InvoiceRead) => {
      queryClient.invalidateQueries({ queryKey: ["invoices", accountId] });
      toast.success(t("invoice_created_successfully"));
      // Navigate to the new invoice
      if (redirectInNewTab) {
        window.open(
          `/facility/${facilityId}/billing/invoices/${invoice.id}`,
          "_blank",
        );
        onSuccess?.();
      } else {
        navigate(`/facility/${facilityId}/billing/invoices/${invoice.id}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || t("failed_to_create_invoice"));
    },
  });

  const onSubmit = (values: FormValues) => {
    const payload: InvoiceCreate = {
      ...values,
      account: accountId,
    };
    createMutation.mutate(payload);
  };

  const handleRowSelection = (id: string) => {
    setSelectedRows((prev: Record<string, boolean>) => {
      const newSelection = { ...prev };
      newSelection[id] = !prev[id];

      // Update form value
      const selectedIds = Object.entries(newSelection)
        .filter(([_, selected]) => selected)
        .map(([id]) => id);

      form.setValue("charge_items", selectedIds);

      return newSelection;
    });
  };

  const toggleItemExpand = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const getUnitComponentsByType = (item: any, type: MonetaryComponentType) => {
    return (
      item.unit_price_components?.filter(
        (c: any) => c.monetary_component_type === type,
      ) || []
    );
  };

  const getTotalComponentsByType = (item: any, type: MonetaryComponentType) => {
    return (
      item.total_price_components?.filter(
        (c: any) => c.monetary_component_type === type,
      ) || []
    );
  };

  const getBaseComponent = (item: any) => {
    return item.unit_price_components?.find(
      (c: any) => c.monetary_component_type === MonetaryComponentType.base,
    );
  };

  const handleLoadMore = () => {
    fetchNextPage();
  };

  const chargeItems =
    preSelectedChargeItems ??
    chargeItemsData?.pages.flatMap((page) => page.results) ??
    [];

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t("create_invoice")}</h1>
        <Link
          href={`/facility/${facilityId}/billing/account/${accountId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← {t("back_to_account")}
        </Link>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("title")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={createMutation.isPending}
                      placeholder={t("invoice_title_placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("payment_terms")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={createMutation.isPending}
                      placeholder={t("payment_terms_placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("note")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={createMutation.isPending}
                      placeholder={t("invoice_note_placeholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {t("billable_charge_items")}
            </h3>
            {isLoading ? (
              <TableSkeleton count={3} />
            ) : !chargeItems || chargeItems.length === 0 ? (
              <div className="rounded-md border p-4 text-center text-gray-500">
                {t("no_billable_items")}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>{t("title")}</TableHead>
                      <TableHead>{t("quantity")}</TableHead>
                      <TableHead>{t("unit_price")}</TableHead>
                      <TableHead>{t("total")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chargeItems.filter(Boolean).flatMap((item) => {
                      const isExpanded = expandedItems[item.id] || false;
                      const baseComponent = getBaseComponent(item);
                      const baseAmount = baseComponent?.amount || 0;

                      const mainRow = (
                        <TableRow key={item.id} className="hover:bg-muted/50">
                          <TableCell className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedRows[item.id] || false}
                              onChange={() => handleRowSelection(item.id)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleItemExpand(item.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.title}
                            <div className="text-xs text-gray-500">
                              {item.id}
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            <MonetaryDisplay amount={baseAmount} />
                          </TableCell>
                          <TableCell>
                            <MonetaryDisplay amount={item.total_price} />
                          </TableCell>
                        </TableRow>
                      );

                      if (!isExpanded) return [mainRow];

                      const detailRows = [
                        <PriceComponentRow
                          key={`${item.id}-discounts`}
                          label={t("discounts")}
                          components={getUnitComponentsByType(
                            item,
                            MonetaryComponentType.discount,
                          )}
                          totalPriceComponents={getTotalComponentsByType(
                            item,
                            MonetaryComponentType.discount,
                          )}
                        />,
                        <PriceComponentRow
                          key={`${item.id}-taxes`}
                          label={t("taxes")}
                          components={getUnitComponentsByType(
                            item,
                            MonetaryComponentType.tax,
                          )}
                          totalPriceComponents={getTotalComponentsByType(
                            item,
                            MonetaryComponentType.tax,
                          )}
                        />,
                      ];

                      const summaryRow = (
                        <TableRow
                          key={`${item.id}-summary`}
                          className="bg-muted/30 font-medium"
                        >
                          <TableCell></TableCell>
                          <TableCell>{t("total")}</TableCell>
                          <TableCell></TableCell>
                          <TableCell></TableCell>
                          <TableCell>
                            <MonetaryDisplay amount={item.total_price} />
                          </TableCell>
                        </TableRow>
                      );

                      return [mainRow, ...detailRows, summaryRow].filter(
                        Boolean,
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            {hasNextPage && (
              <div className="mt-4 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoading || isFetchingNextPage}
                >
                  {isFetchingNextPage ? t("loading_more") : t("load_more")}
                </Button>
              </div>
            )}
            <FormField
              control={form.control}
              name="charge_items"
              render={({ field }) => (
                <FormMessage>
                  {field.value.length > 0
                    ? `${t("selected_items_count")} ${field.value.length}`
                    : t("no_items_selected")}
                </FormMessage>
              )}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              disabled={createMutation.isPending}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  {t("creating")}
                </div>
              ) : (
                t("create_invoice")
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default CreateInvoicePage;
