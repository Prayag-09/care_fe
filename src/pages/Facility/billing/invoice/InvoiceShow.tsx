import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "raviger";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import PaymentReconciliationSheet from "@/pages/Facility/billing/PaymentReconciliationSheet";
import EditInvoiceSheet from "@/pages/Facility/billing/invoice/EditInvoiceSheet";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import { InvoiceStatus } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";

const statusMap: Record<InvoiceStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "secondary" },
  issued: { label: "Issued", color: "primary" },
  balanced: { label: "Balanced", color: "success" },
  cancelled: { label: "Cancelled", color: "destructive" },
  entered_in_error: { label: "Error", color: "destructive" },
};

function formatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount);
}

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
  const queryClient = useQueryClient();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: query(invoiceApi.retrieveInvoice, {
      pathParams: { facilityId, invoiceId },
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

  const handleRemoveChargeItem = () => {
    if (chargeItemToRemove) {
      removeChargeItem({ charge_item: chargeItemToRemove });
    }
  };

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
            <Link href={`/facility/${facilityId}/billing/accounts`}>
              <CareIcon icon="l-arrow-left" className="size-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            Invoice {invoice.id}
            <Badge
              variant={statusMap[invoice.status].color as any}
              className="ml-2"
            >
              {statusMap[invoice.status].label}
            </Badge>
          </h1>
        </div>
        <div className="flex gap-2">
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
          <Button onClick={() => setIsPaymentSheetOpen(true)}>
            <CareIcon icon="l-wallet" className="mr-2 size-4" />
            {t("record_payment")}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("invoice_details")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="font-medium text-muted-foreground">
                    {t("bill_to")}
                  </h3>
                  <div className="mt-2">
                    <p className="font-medium">{invoice.title}</p>
                    {invoice.note && <p>{invoice.note}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="font-semibold text-muted-foreground mb-2">
                      {t("bill_to")}
                    </p>
                    <div>
                      <p className="font-medium">{invoice.title}</p>
                      {invoice.note && (
                        <p className="text-sm text-gray-600">{invoice.note}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-muted-foreground mb-2">
                      {t("invoice_date")}
                    </div>
                    <div>
                      <p>{format(new Date(), "MMM dd, yyyy")}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-sm">
                      <th className="pb-2 text-left font-medium text-muted-foreground">
                        {t("item")}
                      </th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">
                        {t("status")}
                      </th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">
                        {t("qty")}
                      </th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">
                        {t("unit_price")}
                      </th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">
                        {t("amount")}
                      </th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.charge_items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-muted-foreground"
                        >
                          {t("no_charge_items")}
                        </td>
                      </tr>
                    ) : (
                      invoice.charge_items.map((item) => (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="py-4">
                            <div className="">
                              <div>{item.title}</div>
                              <div className="text-xs">{item.id}</div>
                            </div>
                          </td>
                          <td className="py-4">{item.status}</td>
                          <td className="py-4 text-right">{item.quantity}</td>
                          <td className="py-4 text-right">
                            {formatCurrency(item.total_price / item.quantity)}
                          </td>
                          <td className="py-4 text-right">
                            {formatCurrency(item.total_price)}
                          </td>
                          <td className="py-4 text-right">
                            {invoice.status !== InvoiceStatus.balanced &&
                              invoice.status !== InvoiceStatus.cancelled && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setChargeItemToRemove(item.id)}
                                >
                                  <CareIcon
                                    icon="l-trash"
                                    className="size-4 text-destructive"
                                  />
                                </Button>
                              )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                <div className="flex flex-col items-end space-y-2">
                  <div className="flex w-48 justify-between">
                    <span className="text-muted-foreground">
                      {t("subtotal")}
                    </span>
                    <span>{formatCurrency(invoice.total_net)}</span>
                  </div>
                  <div className="flex w-48 justify-between">
                    <span className="text-muted-foreground">{t("tax")}</span>
                    <span>
                      {formatCurrency(invoice.total_gross - invoice.total_net)}
                    </span>
                  </div>
                  <div className="flex w-48 justify-between">
                    <span className="text-muted-foreground">{t("total")}</span>
                    <span className="font-bold">
                      {formatCurrency(invoice.total_gross)}
                    </span>
                  </div>
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
              {/* Payment history will be implemented when the API is available */}
              <div className="text-center text-sm text-muted-foreground">
                {t("no_payments_recorded")}
              </div>
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
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(), "MMM dd, yyyy")}
                  </p>
                </div>
                {invoice.status === InvoiceStatus.issued && (
                  <div className="relative pl-6">
                    <div className="absolute left-0 top-2 size-2 rounded-full bg-primary" />
                    <p className="font-medium">{t("invoice_issued")}</p>
                    <p className="text-sm text-muted-foreground">
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
              onClick={handleRemoveChargeItem}
              disabled={isRemoving}
            >
              {isRemoving ? t("removing...") : t("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default InvoiceShow;
