import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

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

const statusMap: Record<
  InvoiceStatus,
  {
    label: string;
    variant: "default" | "secondary" | "primary" | "destructive" | "outline";
  }
> = {
  [InvoiceStatus.draft]: { label: "draft", variant: "secondary" },
  [InvoiceStatus.issued]: { label: "issued", variant: "default" },
  [InvoiceStatus.balanced]: { label: "balanced", variant: "primary" },
  [InvoiceStatus.cancelled]: { label: "cancelled", variant: "destructive" },
  [InvoiceStatus.entered_in_error]: {
    label: "entered_in_error",
    variant: "destructive",
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
      <div className="flex flex-row justify-between items-center gap-2 max-sm:flex-col">
        <Input
          placeholder={t("search_invoices")}
          value={qParams.search || ""}
          onChange={(e) => updateQuery({ search: e.target.value || undefined })}
          className="sm:max-w-xs"
        />
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
              <SelectItem value="all">t("all")</SelectItem>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoice_number")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("total")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!invoices?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500">
                    {t("no_invoices")}
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <div>{invoice.title}</div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={statusMap[invoice.status].variant}>
                        {t(statusMap[invoice.status].label)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <MonetaryDisplay
                        className="font-medium"
                        amount={invoice.total_gross}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/facility/${facilityId}/billing/invoices/${invoice.id}`}
                          >
                            <CareIcon icon="l-eye" className="size-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/facility/${facilityId}/billing/invoice/${invoice.id}/print`}
                          >
                            <CareIcon icon="l-print" className="size-4" />
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
