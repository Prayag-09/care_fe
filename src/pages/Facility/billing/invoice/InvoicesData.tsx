import { useQuery } from "@tanstack/react-query";
import { ArrowUpRightSquare } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Select,
  SelectContent,
  SelectGroup,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import query from "@/Utils/request/query";
import { InvoiceRead, InvoiceStatus } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";

const statusMap: Record<InvoiceStatus, { label: string; color: string }> = {
  [InvoiceStatus.draft]: {
    label: "draft",
    color: "bg-gray-100 text-gray-900 border-gray-200",
  },
  [InvoiceStatus.issued]: {
    label: "issued",
    color: "bg-blue-100 text-blue-900 border-blue-200",
  },
  [InvoiceStatus.balanced]: {
    label: "balanced",
    color: "bg-green-100 text-green-900 border-green-200",
  },
  [InvoiceStatus.cancelled]: {
    label: "cancelled",
    color: "bg-red-100 text-red-900 border-red-200",
  },
  [InvoiceStatus.entered_in_error]: {
    label: "entered_in_error",
    color: "bg-red-100 text-red-900 border-red-200",
  },
};

export default function InvoicesData({
  facilityId,
  accountId,
  className,
}: {
  facilityId: string;
  accountId?: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: RESULTS_PER_PAGE_LIMIT,
    disableCache: true,
  });

  const tableHeadClass =
    "border-x p-3 text-gray-700 text-sm font-medium leading-5";
  const tableCellClass = "border-x p-3 text-gray-950";

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
    <>
      <div className="flex flex-row justify-between items-center gap-2 max-sm:flex-col pb-4">
        <Tabs
          defaultValue={qParams.status ?? "all"}
          onValueChange={(value) =>
            updateQuery({ status: value === "all" ? undefined : value })
          }
          className="max-sm:hidden"
        >
          <TabsList>
            <TabsTrigger value="all">{t("all")}</TabsTrigger>
            {Object.values(InvoiceStatus).map((status) => (
              <TabsTrigger key={status} value={status}>
                {t(statusMap[status].label)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:max-w-xs border border-gray-400 rounded-md">
          <CareIcon
            icon="l-search"
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500"
          />
          <Input
            placeholder={t("search_invoices")}
            value={qParams.search || ""}
            onChange={(e) =>
              updateQuery({ search: e.target.value || undefined })
            }
            className="w-full pl-10"
          />
        </div>

        <Select
          defaultValue={qParams.status ?? "all"}
          onValueChange={(value) =>
            updateQuery({ status: value === "all" ? undefined : value })
          }
        >
          <SelectTrigger className="sm:hidden">
            <SelectValue placeholder={t("filter_by_status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">{t("all")}</SelectItem>
              {Object.values(InvoiceStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {t(statusMap[status].label)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <TableSkeleton count={3} />
      ) : (
        <div className={className}>
          <Table className="rounded-lg border shadow-base w-full bg-white">
            <TableHeader className="bg-gray-100">
              <TableRow className="border-b">
                <TableHead className={tableHeadClass}>
                  {t("invoice_number")}
                </TableHead>
                <TableHead className={tableHeadClass}>{t("status")}</TableHead>
                <TableHead className={tableHeadClass}>{t("total")}</TableHead>
                <TableHead className={tableHeadClass}>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {!invoices?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    {t("no_invoices")}
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <TableCell className={`${tableCellClass} font-medium`}>
                      <div>{invoice.title}</div>
                    </TableCell>

                    <TableCell className={tableCellClass}>
                      <Badge
                        variant="outline"
                        className={cn(
                          statusMap[invoice.status].color,
                          "text-sm font-medium",
                        )}
                      >
                        {t(statusMap[invoice.status].label)}
                      </Badge>
                    </TableCell>
                    <TableCell className={tableCellClass}>
                      <MonetaryDisplay
                        className="font-medium"
                        amount={invoice.total_gross}
                      />
                    </TableCell>
                    <TableCell className={tableCellClass}>
                      <div className="flex gap-4">
                        <Button
                          variant="secondary"
                          className="border-gray-400 border-1 shadow-sm bg-white"
                          asChild
                        >
                          <Link
                            href={`/facility/${facilityId}/billing/invoice/${invoice.id}/print`}
                          >
                            <CareIcon
                              icon="l-print"
                              className="size-5 text-gray-700 stroke-1"
                            />
                            <span className="text-gray-950 font-medium underline">
                              {t("print")}
                            </span>
                          </Link>
                        </Button>
                        <Button
                          variant="secondary"
                          className="border-gray-400 border-1 shadow-sm bg-white"
                          asChild
                        >
                          <Link
                            href={`/facility/${facilityId}/billing/invoices/${invoice.id}`}
                          >
                            <ArrowUpRightSquare className="size-5 text-gray-700 stroke-1" />
                            <span className="text-gray-950 font-medium">
                              {t("see_invoice")}
                            </span>
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
      {response && <Pagination totalCount={response.count} />}
    </>
  );
}
