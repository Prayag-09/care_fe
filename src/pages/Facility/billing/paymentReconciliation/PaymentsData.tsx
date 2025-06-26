import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { EyeIcon } from "lucide-react";
import { Link } from "raviger";
import { useEffect } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/Table";

import useFilters from "@/hooks/useFilters";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import query from "@/Utils/request/query";
import {
  PAYMENT_RECONCILIATION_OUTCOME_COLORS,
  PAYMENT_RECONCILIATION_STATUS_COLORS,
  PaymentReconciliationPaymentMethod,
  PaymentReconciliationRead,
  PaymentReconciliationStatus,
  PaymentReconciliationType,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";

const typeMap: Record<PaymentReconciliationType, string> = {
  payment: "Payment",
  adjustment: "Adjustment",
  advance: "Advance",
};

const SORT_OPTIONS = {
  "-payment_datetime": "sort_by_latest_payment",
  payment_datetime: "sort_by_oldest_payment",
  "-created_date": "sort_by_latest_created",
  created_date: "sort_by_oldest_created",
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

export default function PaymentsData({
  facilityId,
  accountId,
}: {
  facilityId: string;
  accountId?: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: RESULTS_PER_PAGE_LIMIT,
    disableCache: true,
  });

  useEffect(() => {
    updateQuery({ ordering: "-payment_datetime" });
  }, []);

  const { data: response, isLoading } = useQuery({
    queryKey: ["payments", qParams, accountId],
    queryFn: query(paymentReconciliationApi.listPaymentReconciliation, {
      pathParams: { facilityId },
      queryParams: {
        account: accountId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        search: qParams.search,
        status: qParams.status,
        reconciliation_type: qParams.reconciliation_type,
        ordering: qParams.ordering,
      },
    }),
  });

  const payments = (response?.results as PaymentReconciliationRead[]) || [];

  return (
    <>
      <div className="flex flex-row justify-between items-center gap-2 my-4 max-sm:flex-col w-full">
        <div className="flex flex-row justify-start items-center gap-3 my-4 max-sm:flex-col w-full">
          <Tabs
            defaultValue={qParams.status ?? "all"}
            onValueChange={(value) =>
              updateQuery({ status: value === "all" ? undefined : value })
            }
            className="max-sm:hidden"
          >
            <TabsList>
              <TabsTrigger value="all">{t("all_status")}</TabsTrigger>
              {Object.values(PaymentReconciliationStatus).map((status) => (
                <TabsTrigger key={status} value={status}>
                  {t(status)}
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
            <SelectTrigger className="sm:hidden border-gray-400 text-gray-950 rounded-sm">
              <SelectValue placeholder={t("filter_by_status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">{t("all")}</SelectItem>
                {Object.values(PaymentReconciliationStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(status)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Tabs
            defaultValue={qParams.reconciliation_type ?? "all"}
            onValueChange={(value) =>
              updateQuery({
                reconciliation_type: value === "all" ? undefined : value,
              })
            }
            className="max-sm:hidden"
          >
            <TabsList>
              <TabsTrigger value="all">{t("all_type")}</TabsTrigger>
              {Object.values(PaymentReconciliationType).map((type) => (
                <TabsTrigger key={type} value={type}>
                  {t(typeMap[type])}
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
            <SelectTrigger className="sm:hidden border-gray-400 text-gray-950 rounded-sm">
              <SelectValue placeholder={t("filter_by_type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">{t("all")}</SelectItem>
                {Object.values(PaymentReconciliationType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(typeMap[type])}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <div className="w-full sm:w-fit">
            <Select
              value={qParams.ordering}
              onValueChange={(value) => {
                updateQuery({ ordering: value });
              }}
            >
              <SelectTrigger className="border-gray-400 text-gray-950 rounded-sm">
                <SelectValue placeholder={t("sort_by")} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SORT_OPTIONS).map(([value, text]) => (
                  <SelectItem key={text} value={value}>
                    {t(text)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <CareIcon
            icon="l-search"
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500"
          />
          <Input
            placeholder={t("search_payments")}
            value={qParams.search || ""}
            onChange={(e) =>
              updateQuery({ search: e.target.value || undefined })
            }
            className="w-full pl-10"
          />
        </div>
      </div>
      {isLoading ? (
        <TableSkeleton count={3} />
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("payment_id")}</TableHead>
                <TableHead>{t("invoice")}</TableHead>
                <TableHead>{t("type")}</TableHead>
                <TableHead>{t("method")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead>{t("amount")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("outcome")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!payments?.length ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-500">
                    {t("no_payments")}
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>#{payment.id}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        #{payment.target_invoice?.id}
                      </div>
                      <div className="text-xs text-gray-500 mt-px">
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
                      <MonetaryDisplay amount={payment.amount} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          PAYMENT_RECONCILIATION_STATUS_COLORS[payment.status]
                        }
                      >
                        {t(payment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          PAYMENT_RECONCILIATION_OUTCOME_COLORS[payment.outcome]
                        }
                      >
                        {t(payment.outcome)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        className="font-semibold"
                        asChild
                      >
                        <Link
                          href={`/facility/${facilityId}/billing/payments/${payment.id}`}
                        >
                          <EyeIcon />
                          {t("view")}
                        </Link>
                      </Button>
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
