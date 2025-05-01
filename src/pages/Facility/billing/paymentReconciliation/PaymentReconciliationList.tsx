import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { navigate, useQueryParams } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  PaymentReconciliationOutcome,
  PaymentReconciliationPaymentMethod,
  PaymentReconciliationRead,
  PaymentReconciliationStatus,
  PaymentReconciliationType,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex h-[200px] items-center justify-center text-gray-500">
      <div className="text-center">
        <p>{t("no_payments_found")}</p>
        <p className="text-sm">{t("adjust_payment_filters")}</p>
      </div>
    </div>
  );
}

const statusMap: Record<
  PaymentReconciliationStatus,
  { label: string; color: string }
> = {
  active: { label: "Active", color: "success" },
  cancelled: { label: "Cancelled", color: "destructive" },
  draft: { label: "Draft", color: "secondary" },
  entered_in_error: { label: "Error", color: "destructive" },
};

const typeMap: Record<PaymentReconciliationType, string> = {
  payment: "Payment",
  adjustment: "Adjustment",
  advance: "Advance",
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

// Helper function to format currency
function formatCurrency(amount: number | null, currency: string = "USD") {
  if (amount === null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function PaymentReconciliationList({
  facilityId,
  accountId,
  hideHeader = false,
}: {
  facilityId: string;
  accountId?: string;
  hideHeader?: boolean;
}) {
  const { t } = useTranslation();
  const [urlParams] = useQueryParams();
  const urlAccountId = urlParams.accountId;

  // Use the prop accountId if provided, otherwise use from URL params
  const effectiveAccountId = accountId || urlAccountId;

  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["paymentReconciliations", qParams, effectiveAccountId],
    queryFn: query(paymentReconciliationApi.listInvoice, {
      pathParams: { facilityId },
      queryParams: {
        account: effectiveAccountId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        search: qParams.search,
        status: qParams.status,
        reconciliation_type: qParams.type,
      },
    }),
  });

  const paymentReconciliations =
    (response?.results as PaymentReconciliationRead[]) || [];

  return (
    <Page
      title={hideHeader ? "" : t("payment_reconciliations")}
      hideTitleOnPage={hideHeader}
    >
      <div className={`${hideHeader ? "" : "container mx-auto"}`}>
        {!hideHeader && (
          <div className="mb-4">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold">
                  {t("payment_reconciliation_management")}
                </h1>
                <p className="text-gray-600 text-sm">
                  {effectiveAccountId
                    ? t("view_and_manage_account_payments")
                    : t("view_and_manage_payments")}
                </p>
              </div>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <Input
                placeholder={t("search_payments")}
                value={qParams.search || ""}
                onChange={(e) =>
                  updateQuery({ search: e.target.value || undefined })
                }
                className="max-w-xs"
              />
              <Select
                value={qParams.status ?? "all"}
                onValueChange={(value) =>
                  updateQuery({ status: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t("all_statuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all_statuses")}</SelectItem>
                  {Object.entries(statusMap).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={qParams.type ?? "all"}
                onValueChange={(value) =>
                  updateQuery({ type: value === "all" ? undefined : value })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t("all_types")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("all_types")}</SelectItem>
                  {Object.entries(typeMap).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Always show the filters for the account context */}
        {hideHeader && (
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <Input
              placeholder={t("search_payments")}
              value={qParams.search || ""}
              onChange={(e) =>
                updateQuery({ search: e.target.value || undefined })
              }
              className="max-w-xs"
            />
            <Select
              value={qParams.status ?? "all"}
              onValueChange={(value) =>
                updateQuery({ status: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("all_statuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_statuses")}</SelectItem>
                {Object.entries(statusMap).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={qParams.type ?? "all"}
              onValueChange={(value) =>
                updateQuery({ type: value === "all" ? undefined : value })
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("all_types")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("all_types")}</SelectItem>
                {Object.entries(typeMap).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isLoading ? (
          <TableSkeleton count={5} />
        ) : paymentReconciliations.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("id")}</TableHead>
                  <TableHead>{t("invoice")}</TableHead>
                  <TableHead>{t("type")}</TableHead>
                  <TableHead>{t("method")}</TableHead>
                  <TableHead>{t("date")}</TableHead>
                  <TableHead>{t("amount")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("outcome")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentReconciliations?.map(
                  (payment: PaymentReconciliationRead) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="font-medium">#{payment.id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          <Button
                            variant="link"
                            className="p-0 h-auto"
                            onClick={() =>
                              navigate(
                                `/facility/${facilityId}/billing/invoices/${payment.target_invoice?.id}`,
                              )
                            }
                          >
                            #{payment.target_invoice?.id}
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500">
                          {payment.target_invoice?.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        {typeMap[payment.reconciliation_type]}
                      </TableCell>
                      <TableCell>{methodMap[payment.method]}</TableCell>
                      <TableCell>
                        {payment.payment_datetime
                          ? format(
                              new Date(payment.payment_datetime),
                              "MMM d, yyyy",
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(payment.amount ?? null)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusMap[payment.status]?.color as any}
                        >
                          {statusMap[payment.status]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={outcomeMap[payment.outcome]?.color as any}
                        >
                          {outcomeMap[payment.outcome]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              navigate(
                                `/facility/${facilityId}/billing/payments/${payment.id}`,
                              )
                            }
                            aria-label={t("view")}
                          >
                            <CareIcon icon="l-eye" className="size-4" />
                            <span className="sr-only">{t("view")}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </div>
        )}
        {response && response.count > resultsPerPage && (
          <div className="mt-4 flex justify-center">
            <Pagination totalCount={response.count} />
          </div>
        )}
      </div>
    </Page>
  );
}

export default PaymentReconciliationList;
