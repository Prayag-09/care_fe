import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { Link } from "raviger";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MonetaryDisplay,
  getCurrencySymbol,
} from "@/components/ui/monetary-display";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import AddChargeItemSheet from "@/components/Billing/Invoice/AddChargeItemSheet";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import PaymentReconciliationSheet from "@/pages/Facility/billing/PaymentReconciliationSheet";
import EditInvoiceSheet from "@/pages/Facility/billing/invoice/EditInvoiceSheet";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import {
  InvoiceCreate,
  InvoiceRead,
  InvoiceStatus,
} from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import {
  PaymentReconciliationPaymentMethod,
  PaymentReconciliationStatus,
  PaymentReconciliationType,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";
import facilityApi from "@/types/facility/facilityApi";

const statusMap: Record<InvoiceStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "secondary" },
  issued: { label: "Issued", color: "primary" },
  balanced: { label: "Balanced", color: "success" },
  cancelled: { label: "Cancelled", color: "destructive" },
  entered_in_error: { label: "Error", color: "destructive" },
};

const paymentStatusMap: Record<
  PaymentReconciliationStatus,
  { label: string; color: string }
> = {
  active: { label: "active", color: "primary" },
  cancelled: { label: "cancelled", color: "destructive" },
  draft: { label: "draft", color: "secondary" },
  entered_in_error: { label: "entered_in_error", color: "destructive" },
};

const paymentMethodMap: Record<PaymentReconciliationPaymentMethod, string> = {
  cash: "Cash",
  ccca: "Credit Card",
  cchk: "Credit Check",
  cdac: "Credit Account",
  chck: "Check",
  ddpo: "Direct Deposit",
  debc: "Debit Card",
};

export function InvoiceShow({
  facilityId,
  invoiceId,
}: {
  facilityId: string;
  invoiceId: string;
}) {
  const { t } = useTranslation();
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [chargeItemToRemove, setChargeItemToRemove] = useState<string | null>(
    null,
  );
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | null>(
    null,
  );
  const queryClient = useQueryClient();

  const tableHeadClass = "border-r border-gray-200 font-semibold text-center";
  const tableCellClass =
    "border-r border-gray-200 font-medium text-gray-950 text-sm";

  // Fetch facility data for available components
  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.getFacility, {
      pathParams: { id: facilityId },
    }),
  });

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: query(invoiceApi.retrieveInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
  });

  const { data: payments, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["payments", invoiceId],
    queryFn: query(paymentReconciliationApi.listPaymentReconciliation, {
      pathParams: { facilityId },
      queryParams: {
        target_invoice: invoiceId,
        limit: 100,
        reconciliation_type: PaymentReconciliationType.payment,
      },
    }),
  });

  const { mutate: removeChargeItem, isPending: isRemoving } = useMutation({
    mutationFn: mutate(chargeItemApi.removeChargeItemFromInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
    onSuccess: () => {
      toast.success(t("charge_item_removed_successfully"));
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      setChargeItemToRemove(null);
    },
    onError: () => {
      toast.error(t("failed_to_remove_charge_item"));
    },
  });

  const { mutate: cancelInvoice, isPending: isCancelPending } = useMutation({
    mutationFn: mutate(invoiceApi.cancelInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
    onSuccess: () => {
      toast.success(t("invoice_cancelled_successfully"));
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
    },
    onError: () => {
      toast.error(t("failed_to_cancel_invoice"));
    },
  });

  const { mutate: updateInvoice, isPending: isUpdatingInvoice } = useMutation({
    mutationFn: mutate(invoiceApi.updateInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
    onSuccess: () => {
      toast.success(t("invoice_updated_successfully"));
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
    },
    onError: () => {
      toast.error(t("failed_to_update_invoice"));
    },
  });

  const handleRemoveChargeItem = () => {
    if (chargeItemToRemove) {
      removeChargeItem({ charge_item: chargeItemToRemove });
    }
  };

  const getUnitComponentsByType = (item: any, type: MonetaryComponentType) => {
    return (
      item.unit_price_components?.filter(
        (c: any) => c.monetary_component_type === type,
      ) || []
    );
  };

  const getApplicableTaxColumns = (invoice: InvoiceRead) => {
    // Get all unique tax codes from invoice charge items using a Set
    const invoiceTaxCodes = new Set<string>();
    invoice.charge_items.forEach((item) => {
      getUnitComponentsByType(item, MonetaryComponentType.tax).forEach(
        (taxComponent: any) => {
          invoiceTaxCodes.add(taxComponent.code.code);
        },
      );
    });
    // Convert Set back to array for return value
    return Array.from(invoiceTaxCodes);
  };

  const getBaseComponent = (item: any) => {
    return item.unit_price_components?.find(
      (c: any) => c.monetary_component_type === MonetaryComponentType.base,
    );
  };

  const handleStatusChange = (status: InvoiceStatus) => {
    if (
      status === InvoiceStatus.cancelled ||
      status === InvoiceStatus.entered_in_error ||
      status === InvoiceStatus.balanced
    ) {
      setSelectedStatus(status);
      setReasonDialogOpen(true);
    } else {
      const data: InvoiceCreate = {
        title: invoice?.title || "",
        status,
        payment_terms: invoice?.payment_terms,
        note: invoice?.note,
        account: invoice?.account.id || "",
        charge_items: invoice?.charge_items.map((item) => item.id) || [],
      };

      updateInvoice(data);
    }
  };

  const handleDialogSubmit = () => {
    if (!selectedStatus) return;

    if (selectedStatus === InvoiceStatus.balanced) {
      updateInvoice({
        title: invoice?.title || "",
        status: selectedStatus,
        payment_terms: invoice?.payment_terms,
        note: invoice?.note,
        account: invoice?.account.id || "",
        charge_items: invoice?.charge_items.map((item) => item.id) || [],
      });
    } else {
      cancelInvoice({ reason: selectedStatus });
    }

    setReasonDialogOpen(false);
  };

  const canEdit =
    invoice?.status !== InvoiceStatus.entered_in_error &&
    invoice?.status !== InvoiceStatus.cancelled;

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  if (!invoice) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{t("invoice_not_found")}</h2>
          <p className="mt-2 text-gray-600">{t("invoice_may_not_exist")}</p>
          <Button asChild className="mt-4">
            <Link href={`/facility/${facilityId}/billing/invoices`}>
              {t("back_to_invoices")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            {/* TODO: Redirect to the account that the invoice is for once the API is updated */}
            <Link
              href={`/facility/${facilityId}/billing/account/${invoice.account.id}`}
            >
              <CareIcon icon="l-arrow-left" className="size-4" />
            </Link>
          </Button>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <h1 className="text-2xl font-bold">{t("invoice")}</h1>

              <Badge
                variant={statusMap[invoice.status].color as any}
                className="ml-2"
              >
                {statusMap[invoice.status].label}
              </Badge>
            </div>
            <span className="text-sm text-gray-500"> {invoice.id}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice?.status === InvoiceStatus.draft && (
            <Button
              variant="primary"
              className="w-full flex flex-row justify-stretch items-center"
              onClick={() => handleStatusChange(InvoiceStatus.issued)}
              disabled={isUpdatingInvoice}
            >
              <CareIcon icon="l-wallet" className="mr-1" />
              {t("mark_as_issued")}
            </Button>
          )}
          {invoice?.status === InvoiceStatus.issued && (
            <Button
              variant="primary"
              className="w-full flex flex-row justify-stretch items-center"
              onClick={() => handleStatusChange(InvoiceStatus.balanced)}
              disabled={isUpdatingInvoice}
            >
              <CareIcon icon="l-wallet" className="mr-1" />
              {t("mark_as_balanced")}
            </Button>
          )}
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  data-cy="invoice-actions-button"
                  className="px-2"
                >
                  <CareIcon icon="l-ellipsis-v" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild className="text-primary-900">
                  <Button
                    variant="ghost"
                    onClick={() => handleStatusChange(InvoiceStatus.cancelled)}
                    disabled={isCancelPending}
                    className="w-full flex flex-row justify-stretch items-center"
                    data-cy="invoice-cancel-button"
                  >
                    <CareIcon icon="l-times-circle" className="mr-1" />
                    <span>{t("mark_as_cancelled")}</span>
                  </Button>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-primary-900">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      handleStatusChange(InvoiceStatus.entered_in_error)
                    }
                    disabled={isCancelPending}
                    className="w-full flex flex-row justify-stretch items-center"
                    data-cy="invoice-mark-error-button"
                  >
                    <CareIcon icon="l-exclamation-circle" className="mr-1" />
                    <span>{t("mark_as_entered_in_error")}</span>
                  </Button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <EditInvoiceSheet
            facilityId={facilityId}
            invoiceId={invoiceId}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: ["invoice", invoiceId],
              });
            }}
          />
          <Button variant="outline" asChild>
            <Link
              href={`/facility/${facilityId}/billing/invoice/${invoiceId}/print`}
            >
              <CareIcon icon="l-print" className="mr-2 size-4" />
              {t("print")}
            </Link>
          </Button>
          {invoice.status === InvoiceStatus.issued && (
            <Button onClick={() => setIsPaymentSheetOpen(true)}>
              <CareIcon icon="l-wallet" className="mr-2 size-4" />
              {t("record_payment")}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-row justify-between items-center">
                <div className="space-y-1">
                  <div className="font-medium text-xl">
                    {t("invoice_details")}
                  </div>
                </div>
                {invoice.status === InvoiceStatus.draft && (
                  <AddChargeItemSheet
                    facilityId={facilityId}
                    invoiceId={invoiceId}
                    accountId={invoice.account.id}
                    trigger={
                      <Button variant="primary">
                        <CareIcon icon="l-plus" className="mr-2 size-4" />
                        {t("add_charge_item")}
                      </Button>
                    }
                  />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="font-semibold text-gray-500 mb-2">
                    {t("bill_to")}
                  </div>
                  <div>
                    <p className="font-medium">
                      {invoice.account.patient.name}
                    </p>
                    <p className="font-normal whitespace-pre-wrap">
                      {invoice.account.patient.address}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t("phone")}:{" "}
                      {formatPhoneNumberIntl(
                        invoice.account.patient.phone_number,
                      )}
                    </p>
                  </div>
                  <div className="mt-2">
                    {invoice.note && <p>{invoice.note}</p>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6 mt-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Invoice Number
                  </h3>
                  <p className="text-sm">{invoice.title || invoice.id}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Issue Date
                  </h3>
                  {/* <p className="text-sm">{formatDate(invoice.created_at)}</p> */}
                </div>
              </div>

              <div className="rounded-sm border border-gray-300 shadow-xs overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200">
                      <TableHead className={tableHeadClass}>#</TableHead>
                      <TableHead className={tableHeadClass}>
                        {t("item")}
                      </TableHead>
                      <TableHead className={tableHeadClass}>
                        {t("unit_price")} ({getCurrencySymbol()})
                      </TableHead>
                      <TableHead className={tableHeadClass}>
                        {t("qty")}
                      </TableHead>
                      <TableHead className={tableHeadClass}>
                        {t("discount")}
                      </TableHead>
                      {getApplicableTaxColumns(invoice).map((taxCode) => (
                        <TableHead key={taxCode} className={tableHeadClass}>
                          {t(taxCode)}
                        </TableHead>
                      ))}
                      <TableHead
                        className={
                          invoice.status === InvoiceStatus.draft
                            ? tableHeadClass
                            : "font-semibold text-center"
                        }
                      >
                        {t("total")} ({getCurrencySymbol()})
                      </TableHead>
                      {invoice?.status === InvoiceStatus.draft && (
                        <TableHead className="font-semibold text-center">
                          {t("actions")}
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.charge_items.length === 0 ? (
                      <TableRow className="border-b border-gray-200">
                        <TableCell
                          colSpan={
                            invoice?.status === InvoiceStatus.draft
                              ? 8 + getApplicableTaxColumns(invoice).length
                              : 7 + getApplicableTaxColumns(invoice).length
                          }
                          className="text-center text-gray-500"
                        >
                          {t("no_charge_items")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoice.charge_items.flatMap((item, index) => {
                        const baseComponent = getBaseComponent(item);
                        const baseAmount = baseComponent?.amount || 0;

                        const mainRow = (
                          <TableRow
                            key={item.id}
                            className="border-b border-gray-200 hover:bg-muted/50"
                          >
                            <TableCell
                              className={cn(tableCellClass, "text-center")}
                            >
                              {index + 1}
                            </TableCell>
                            <TableCell
                              className={cn(tableCellClass, "font-medium")}
                            >
                              {item.title}
                            </TableCell>
                            <TableCell
                              className={cn(tableCellClass, "text-right")}
                            >
                              <MonetaryDisplay
                                amount={baseAmount}
                                hideCurrency
                              />
                            </TableCell>
                            <TableCell
                              className={cn(tableCellClass, "text-center")}
                            >
                              {item.quantity}
                            </TableCell>
                            <TableCell
                              className={cn(tableCellClass, "text-right")}
                            >
                              <div className="flex flex-col items-end gap-0.5">
                                <MonetaryDisplay
                                  amount={item.total_price_components
                                    .filter(
                                      (c) =>
                                        c.monetary_component_type ===
                                        MonetaryComponentType.discount,
                                    )
                                    .reduce(
                                      (acc, curr) => acc + (curr.amount || 0),
                                      0,
                                    )}
                                  hideCurrency
                                />
                                {item.unit_price_components
                                  .filter(
                                    (c) =>
                                      c.monetary_component_type ===
                                      MonetaryComponentType.discount,
                                  )
                                  .map((discountComponent, idx) => (
                                    <div
                                      key={idx}
                                      className="text-xs text-gray-500"
                                    >
                                      <MonetaryDisplay
                                        {...discountComponent}
                                        hideCurrency
                                      />
                                    </div>
                                  ))}
                              </div>
                            </TableCell>
                            {facilityData &&
                              getApplicableTaxColumns(invoice).map(
                                (taxCode) => (
                                  <TableCell
                                    key={taxCode}
                                    className={cn(tableCellClass, "text-right")}
                                  >
                                    {(() => {
                                      const totalAmount =
                                        item.total_price_components.find(
                                          (c) => c.code?.code === taxCode,
                                        )?.amount;
                                      const unitAmount =
                                        item.unit_price_components.find(
                                          (c) => c.code?.code === taxCode,
                                        );
                                      return (
                                        <div className="flex flex-col items-end gap-0.5">
                                          <MonetaryDisplay
                                            amount={totalAmount}
                                            hideCurrency
                                          />
                                          <div className="text-xs text-gray-500">
                                            {totalAmount && (
                                              <MonetaryDisplay
                                                {...unitAmount}
                                                hideCurrency
                                              />
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })()}
                                  </TableCell>
                                ),
                              )}
                            <TableCell
                              className={
                                invoice.status === InvoiceStatus.draft
                                  ? cn(tableCellClass, "text-right")
                                  : "text-right"
                              }
                            >
                              <MonetaryDisplay
                                amount={item.total_price}
                                hideCurrency
                              />
                            </TableCell>
                            {invoice.status === InvoiceStatus.draft && (
                              <TableCell className="text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>
                                      {t("actions")}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setChargeItemToRemove(item.id)
                                      }
                                      className="text-destructive"
                                    >
                                      <CareIcon
                                        icon="l-trash"
                                        className="mr-2 size-4"
                                      />
                                      <span>{t("remove")}</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            )}
                          </TableRow>
                        );

                        return [mainRow];
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col items-end space-y-2">
                {/* Base Amount */}
                {invoice.total_price_components
                  ?.filter(
                    (c) =>
                      c.monetary_component_type === MonetaryComponentType.base,
                  )
                  .map((component, index) => (
                    <div
                      key={`base-${index}`}
                      className="flex w-64 justify-between"
                    >
                      <span className="text-gray-500">
                        {component.code?.display || t("base_amount")}
                      </span>
                      <MonetaryDisplay amount={component.amount} />
                    </div>
                  ))}

                {/* Surcharges */}
                {invoice.total_price_components
                  ?.filter(
                    (c) =>
                      c.monetary_component_type ===
                      MonetaryComponentType.surcharge,
                  )
                  .map((component, index) => (
                    <div
                      key={`discount-${index}`}
                      className="flex w-64 justify-between text-gray-500 text-sm"
                    >
                      <span>
                        {component.code && `${component.code.display} `}(
                        {t("surcharge")})
                      </span>
                      <span>
                        + <MonetaryDisplay {...component} />
                      </span>
                    </div>
                  ))}

                {/* Discounts */}
                {invoice.total_price_components
                  ?.filter(
                    (c) =>
                      c.monetary_component_type ===
                      MonetaryComponentType.discount,
                  )
                  .map((component, index) => (
                    <div
                      key={`discount-${index}`}
                      className="flex w-64 justify-between text-gray-500 text-sm"
                    >
                      <span>
                        {component.code && `${component.code.display} `}(
                        {t("discount")})
                      </span>
                      <span>
                        - <MonetaryDisplay {...component} />
                      </span>
                    </div>
                  ))}

                {/* Taxes */}
                {invoice.total_price_components
                  ?.filter(
                    (c) =>
                      c.monetary_component_type === MonetaryComponentType.tax,
                  )
                  .map((component, index) => (
                    <div
                      key={`tax-${index}`}
                      className="flex w-64 justify-between text-gray-500 text-sm"
                    >
                      <span>
                        {component.code && `${component.code.display} `}(
                        {t("tax")})
                      </span>
                      <span>
                        + <MonetaryDisplay {...component} />
                      </span>
                    </div>
                  ))}

                <Separator className="my-2" />

                {/* Subtotal */}
                <div className="flex w-64 justify-between">
                  <span className="text-gray-500">{t("net_amount")}</span>
                  <MonetaryDisplay amount={invoice.total_net} />
                </div>

                {/* Total */}
                <div className="flex w-64 justify-between font-bold">
                  <span>{t("total")}</span>
                  <MonetaryDisplay amount={invoice.total_gross} />
                </div>
              </div>
            </CardContent>
          </Card>
          <div>
            {invoice.payment_terms && (
              <Card className="mt-4">
                <CardHeader>{t("payment_terms")}</CardHeader>
                <CardContent>
                  <p className="prose w-full text-sm">
                    {invoice.payment_terms}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("payment_history")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("method")}</TableHead>
                    <TableHead>{t("date")}</TableHead>
                    <TableHead>{t("amount")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!payments?.results?.length || isPaymentsLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-sm text-gray-500"
                      >
                        {t("no_payments_recorded")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.results.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {paymentMethodMap[payment.method]}
                        </TableCell>
                        <TableCell>
                          {payment.payment_datetime
                            ? format(
                                new Date(payment.payment_datetime),
                                "MMM d, yyyy hh:mm a",
                              )
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <MonetaryDisplay amount={payment.amount || 0} />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              paymentStatusMap[payment.status].color as any
                            }
                          >
                            {t(paymentStatusMap[payment.status].label)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("invoice_timeline")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative pl-6">
                  <div className="absolute left-0 top-2 size-2 rounded-full bg-primary" />
                  <p className="font-medium">{t("invoice_created")}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(), "MMM dd, yyyy")}
                  </p>
                </div>
                {invoice.status === InvoiceStatus.issued && (
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-2 size-2 rounded-full bg-primary" />
                    <p className="font-medium">{t("invoice_issued")}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(), "MMM dd, yyyy")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PaymentReconciliationSheet
        open={isPaymentSheetOpen}
        onOpenChange={setIsPaymentSheetOpen}
        facilityId={facilityId}
        invoice={invoice}
        accountId={invoice.account.id}
      />

      <AlertDialog
        open={!!chargeItemToRemove}
        onOpenChange={(open) => !open && setChargeItemToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("remove_charge_item")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("remove_charge_item_confirmation")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "destructive" }))}
              onClick={handleRemoveChargeItem}
              disabled={isRemoving}
            >
              {isRemoving ? t("removing...") : t("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={reasonDialogOpen}
        onOpenChange={(open) => {
          setReasonDialogOpen(open);
          if (!open) {
            setTimeout(() => setSelectedStatus(null), 150);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm")}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedStatus === InvoiceStatus.balanced
                ? t("are_you_sure_want_to_mark_as_balanced")
                : selectedStatus === InvoiceStatus.entered_in_error
                  ? t("are_you_sure_want_to_mark_as_error")
                  : t("are_you_sure_want_to_cancel_invoice")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDialogSubmit}
              className={cn(
                buttonVariants({
                  variant:
                    selectedStatus === InvoiceStatus.balanced
                      ? "primary"
                      : "destructive",
                }),
              )}
            >
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default InvoiceShow;
