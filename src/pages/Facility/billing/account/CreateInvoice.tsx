import { zodResolver } from "@hookform/resolvers/zod";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Link } from "raviger";
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
import { Textarea } from "@/components/ui/textarea";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  ChargeItemBase,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import { InvoiceCreate, InvoiceStatus } from "@/types/billing/invoice/invoice";
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
}

export function CreateInvoicePage({
  facilityId,
  accountId,
}: CreateInvoicePageProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      status: InvoiceStatus.draft,
      payment_terms: "",
      note: "",
      charge_items: [],
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
      return response as PaginatedResponse<ChargeItemBase>;
    },
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: PaginatedResponse<ChargeItemBase>,
      allPages: PaginatedResponse<ChargeItemBase>[],
    ) => {
      const currentOffset = allPages.length * ITEMS_PER_PAGE;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    enabled: !!facilityId && !!accountId,
  });

  const createMutation = useMutation({
    mutationFn: mutate(invoiceApi.createInvoice, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices", accountId] });
      toast.success(t("invoice_created_successfully"));
      // Navigate back to invoices list
      window.history.back();
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

  const handleLoadMore = () => {
    fetchNextPage();
  };

  const chargeItems =
    chargeItemsData?.pages.flatMap((page) => page.results) ?? [];

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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("status")}</FormLabel>
                  <Select
                    disabled={createMutation.isPending}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("select_status")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(InvoiceStatus).map((status) => (
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
              name="payment_terms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("payment_terms")}</FormLabel>
                  <FormControl>
                    <Input
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
                      <TableHead>{t("amount")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chargeItems.filter(Boolean).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedRows[item.id] || false}
                            onChange={() => handleRowSelection(item.id)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell>{item.title}</TableCell>
                        <TableCell>
                          {item.unit_price_component?.[0]
                            ? `${item.unit_price_component[0].amount} ${
                                item.unit_price_component[0].code?.code || "INR"
                              }`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
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
                    ? t("selected_items_count", { count: field.value.length })
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
