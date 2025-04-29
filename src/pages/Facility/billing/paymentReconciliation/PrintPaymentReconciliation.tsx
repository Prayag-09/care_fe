import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import Loading from "@/components/Common/Loading";

import query from "@/Utils/request/query";
import {
  PaymentReconciliationOutcome,
  PaymentReconciliationPaymentMethod,
  PaymentReconciliationStatus,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";

const statusMap: Record<
  PaymentReconciliationStatus,
  { label: string; color: string }
> = {
  active: { label: "Active", color: "success" },
  cancelled: { label: "Cancelled", color: "destructive" },
  draft: { label: "Draft", color: "secondary" },
  entered_in_error: { label: "Error", color: "destructive" },
};

const outcomeMap: Record<
  PaymentReconciliationOutcome,
  { label: string; color: string }
> = {
  complete: { label: "Complete", color: "success" },
  error: { label: "Error", color: "destructive" },
  queued: { label: "Queued", color: "secondary" },
  partial: { label: "Partial", color: "warning" },
};

const methodMap: Record<PaymentReconciliationPaymentMethod, string> = {
  cash: "Cash",
  ccca: "Credit Card",
  cchk: "Credit Check",
  cdac: "Credit Account",
  chck: "Check",
  ddpo: "Direct Deposit",
  debc: "Debit Card",
};

function formatCurrency(amount: number | null, currency: string = "INR") {
  if (amount === null) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount);
}

type PrintPaymentReconciliationProps = {
  facilityId: string;
  paymentReconciliationId: string;
};

export function PrintPaymentReconciliation({
  facilityId,
  paymentReconciliationId,
}: PrintPaymentReconciliationProps) {
  const { t } = useTranslation();

  const { data: payment, isLoading } = useQuery({
    queryKey: ["paymentReconciliation", paymentReconciliationId],
    queryFn: query(paymentReconciliationApi.retrievePaymentReconciliation, {
      pathParams: { facilityId, paymentReconciliationId },
    }),
  });

  if (isLoading || !payment) {
    return <Loading />;
  }

  return (
    <PrintPreview title={`${t("payment_receipt")} #${payment.id}`}>
      <div className="min-h-screen md:p-2 max-w-4xl mx-auto">
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-4 pb-2 border-b border-gray-200">
            <img
              src={careConfig.mainLogo?.dark}
              alt="Care Logo"
              className="h-10 w-auto object-contain mb-2 sm:mb-0 sm:order-2"
            />
            <div className="text-center sm:text-left sm:order-1">
              <h1 className="text-3xl font-semibold">{t("payment_receipt")}</h1>
              <h2 className="text-gray-500 uppercase text-sm tracking-wide mt-1 font-semibold">
                {t("payment")} #{payment.id}
                <span className="ml-2">
                  <Badge
                    variant={statusMap[payment.status]?.color as any}
                    className="align-middle"
                  >
                    {statusMap[payment.status]?.label}
                  </Badge>
                  <Badge
                    variant={outcomeMap[payment.outcome]?.color as any}
                    className="align-middle ml-1"
                  >
                    {outcomeMap[payment.outcome]?.label}
                  </Badge>
                </span>
              </h2>
            </div>
          </div>

          {/* Payment Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <div className="font-medium font-semibold text-muted-foreground mb-1">
                {t("payment_date")}
              </div>
              <div>
                <p>
                  {payment.payment_datetime
                    ? format(new Date(payment.payment_datetime), "MMM dd, yyyy")
                    : format(new Date(), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium font-semibold text-muted-foreground mb-1">
                {t("payment_method")}
              </div>
              <div>
                <p className="font-medium">{methodMap[payment.method]}</p>
              </div>
            </div>
            {(payment.reference_number || payment.authorization) && (
              <div>
                <div className="font-semibold text-muted-foreground mb-1">
                  {t("reference_details")}
                </div>
                <div>
                  {payment.reference_number && (
                    <p>
                      {t("reference")}: {payment.reference_number}
                    </p>
                  )}
                  {payment.authorization && (
                    <p>
                      {t("authorization")}: {payment.authorization}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Related Invoice */}
          {payment.target_invoice && (
            <>
              <h3 className="font-medium text-lg mb-2">
                {t("related_invoice")}
              </h3>
              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-sm">
                      <th className="pb-2 text-left font-medium text-muted-foreground">
                        {t("invoice_number")}
                      </th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">
                        {t("title")}
                      </th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">
                        {t("status")}
                      </th>
                      <th className="pb-2 text-right font-medium text-muted-foreground">
                        {t("amount")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-4">
                        <div>
                          <div>#{payment.target_invoice.id}</div>
                        </div>
                      </td>
                      <td className="py-4">{payment.target_invoice.title}</td>
                      <td className="py-4">{payment.target_invoice.status}</td>
                      <td className="py-4 text-right">
                        {formatCurrency(
                          payment.target_invoice.total_gross ?? null,
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Additional Details */}
          <div className="mb-6">
            <h3 className="font-medium text-lg mb-2">{t("payment_details")}</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm">
                    <th className="pb-2 text-left font-medium text-muted-foreground">
                      {t("type")}
                    </th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">
                      {t("kind")}
                    </th>
                    <th className="pb-2 text-left font-medium text-muted-foreground">
                      {t("issuer_type")}
                    </th>
                    <th className="pb-2 text-right font-medium text-muted-foreground">
                      {t("amount")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-4">
                      {payment.reconciliation_type.charAt(0).toUpperCase() +
                        payment.reconciliation_type.slice(1)}
                    </td>
                    <td className="py-4">
                      {payment.kind.charAt(0).toUpperCase() +
                        payment.kind.slice(1)}
                    </td>
                    <td className="py-4">
                      {payment.issuer_type.charAt(0).toUpperCase() +
                        payment.issuer_type.slice(1)}
                    </td>
                    <td className="py-4 text-right">
                      {formatCurrency(payment.amount ?? null)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex flex-col items-end space-y-2 mt-6">
            <div className="flex w-48 justify-between">
              <span className="text-muted-foreground">{t("amount")}</span>
              <span>{formatCurrency(payment.amount ?? null)}</span>
            </div>
            {payment.method === "cash" && (
              <>
                <div className="flex w-48 justify-between">
                  <span className="text-muted-foreground">{t("tendered")}</span>
                  <span>{formatCurrency(payment.tendered_amount ?? null)}</span>
                </div>
                <div className="flex w-48 justify-between">
                  <span className="text-muted-foreground">{t("returned")}</span>
                  <span>{formatCurrency(payment.retruned_amount ?? null)}</span>
                </div>
              </>
            )}
            <div className="flex w-48 justify-between font-bold border-t pt-2">
              <span>{t("total")}</span>
              <span>{formatCurrency(payment.amount ?? null)}</span>
            </div>
          </div>

          {/* Notes */}
          {payment.note && (
            <div className="mt-8 text-sm text-gray-600 border-t pt-4">
              <h3 className="font-medium mb-2">{t("notes")}</h3>
              <p>{payment.note}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 border-t pt-4 text-center text-sm text-gray-500">
            <p>{t("thank_you_for_your_payment")}</p>
            <p>{format(new Date(), "PPP")}</p>
          </div>
        </div>
      </div>
    </PrintPreview>
  );
}

export default PrintPaymentReconciliation;
