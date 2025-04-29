import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
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
import { InvoiceRead, InvoiceStatus } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex h-[200px] items-center justify-center text-gray-500">
      <div className="text-center">
        <p>{t("no_invoices_found")}</p>
        <p className="text-sm">{t("adjust_invoice_filters")}</p>
      </div>
    </div>
  );
}

const statusMap: Record<InvoiceStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "secondary" },
  issued: { label: "Issued", color: "primary" },
  balanced: { label: "Balanced", color: "success" },
  cancelled: { label: "Cancelled", color: "destructive" },
  entered_in_error: { label: "Error", color: "destructive" },
};

export function InvoiceList({
  facilityId,
  accountId,
}: {
  facilityId: string;
  accountId?: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["invoices", qParams, accountId],
    queryFn: query(
      invoiceApi.retrieveInvoice.method === "GET"
        ? invoiceApi.listInvoice
        : invoiceApi.listInvoice,
      {
        pathParams: { facilityId },
        queryParams: {
          account: accountId,
          limit: resultsPerPage,
          offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
          search: qParams.search,
          status: qParams.status,
        },
      },
    ),
  });

  const invoices = (response?.results as InvoiceRead[]) || [];

  return (
    <Page title={t("invoices")}>
      <div className="container mx-auto">
        <div className="mb-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                {t("invoice_management")}
              </h1>
              <p className="text-gray-600 text-sm">
                {accountId
                  ? t("view_and_manage_account_invoices")
                  : t("view_and_manage_invoices")}
              </p>
            </div>
            {accountId && (
              <Button
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/billing/account/${accountId}/invoices/create`,
                  )
                }
              >
                {t("create_invoice")}
              </Button>
            )}
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <Input
              placeholder={t("search_invoices")}
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
          </div>
        </div>
        {isLoading ? (
          <TableSkeleton count={5} />
        ) : invoices.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("invoice")}</TableHead>
                  <TableHead>{t("title")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("total_amount")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: InvoiceRead) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <div className="font-medium">#{invoice.id}</div>
                    </TableCell>
                    <TableCell>
                      <div>{invoice.title}</div>
                      {invoice.note && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {invoice.note}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusMap[invoice.status]?.color as any}>
                        {statusMap[invoice.status]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {invoice.total_gross ? (
                        <div className="font-medium">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(invoice.total_gross)}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(
                              `/facility/${facilityId}/billing/invoices/${invoice.id}`,
                            )
                          }
                          aria-label={t("view")}
                        >
                          <CareIcon icon="l-eye" className="size-4" />
                          <span className="sr-only">{t("view")}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(
                              `/facility/${facilityId}/billing/invoice/${invoice.id}/print`,
                            )
                          }
                          aria-label={t("print")}
                        >
                          <CareIcon icon="l-print" className="size-4" />
                          <span className="sr-only">{t("print")}</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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

export default InvoiceList;
