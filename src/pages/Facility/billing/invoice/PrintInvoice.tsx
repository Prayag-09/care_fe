import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import Loading from "@/components/Common/Loading";

import query from "@/Utils/request/query";
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

type PrintInvoiceProps = {
  facilityId: string;
  invoiceId: string;
};

export function PrintInvoice({ facilityId, invoiceId }: PrintInvoiceProps) {
  const { t } = useTranslation();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: query(invoiceApi.retrieveInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
  });

  if (isLoading || !invoice) {
    return <Loading />;
  }

  return (
    <PrintPreview title={`${t("invoice")} #${invoice.id}`}>
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
              <h1 className="text-3xl font-semibold">{t("invoice")}</h1>
              <h2 className="text-gray-500 uppercase text-sm tracking-wide mt-1 font-semibold">
                {t("invoice")} #{invoice.id}
                <span className="ml-2">
                  <Badge
                    variant={statusMap[invoice.status].color as any}
                    className="align-middle"
                  >
                    {statusMap[invoice.status].label}
                  </Badge>
                </span>
              </h2>
            </div>
          </div>

          {/* Invoice Information */}
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

          <Separator className="my-6" />

          {/* Items Table */}
          <div className="overflow-x-auto">
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
                </tr>
              </thead>
              <tbody>
                {invoice.charge_items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-4">
                      <div>
                        <div>{item.title}</div>
                        <div className="text-xs text-gray-500">{item.id}</div>
                      </div>
                    </td>
                    <td className="py-4">{item.status}</td>
                    <td className="py-4 text-right">{item.quantity}</td>
                    <td className="py-4 text-right">0</td>
                    <td className="py-4 text-right">0</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex flex-col items-end space-y-2 mt-6">
            <div className="flex w-48 justify-between">
              <span className="text-muted-foreground">{t("subtotal")}</span>
              <span>{formatCurrency(invoice.total_net)}</span>
            </div>
            <div className="flex w-48 justify-between">
              <span className="text-muted-foreground">{t("tax")}</span>
              <span>
                {formatCurrency(invoice.total_gross - invoice.total_net)}
              </span>
            </div>
            <div className="flex w-48 justify-between font-bold border-t pt-2">
              <span>{t("total")}</span>
              <span>{formatCurrency(invoice.total_gross)}</span>
            </div>
          </div>

          {/* Footer with Terms */}
          {invoice.payment_terms && (
            <div className="mt-10 text-sm text-gray-600 border-t pt-4">
              <h3 className="font-medium mb-2">{t("payment_terms")}</h3>
              <p className="prose w-full text-sm">{invoice.payment_terms}</p>
            </div>
          )}
        </div>
      </div>
    </PrintPreview>
  );
}

export default PrintInvoice;
