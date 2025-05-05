import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Avatar } from "@/components/Common/Avatar";
import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  type AccountRead,
  billingStatusColorMap,
  statusColorMap,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";

import AccountSheet from "./AccountSheet";

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex h-[200px] items-center justify-center text-gray-500">
      <div className="text-center">
        <p>{t("no_accounts_found")}</p>
        <p className="text-sm">{t("adjust_account_filters")}</p>
      </div>
    </div>
  );
}

function formatCurrency(amount?: number | string) {
  return Number(amount).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });
}

function formatDate(date?: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AccountList({
  facilityId,
  patientId,
  hideTitleOnPage = false,
  className,
}: {
  facilityId: string;
  patientId?: string;
  hideTitleOnPage?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editingAccount, setEditingAccount] =
    React.useState<AccountRead | null>(null);
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["accounts", qParams],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId },
      queryParams: {
        patient: patientId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        search: qParams.search,
        status: qParams.status,
        billing_status: qParams.billing_status,
      },
    }),
  });

  const accounts = (response?.results as AccountRead[]) || [];

  return (
    <Page
      title={t("accounts")}
      hideTitleOnPage={hideTitleOnPage}
      className={cn(hideTitleOnPage && "md:px-0", className)}
    >
      <div className={cn("container mx-auto", !hideTitleOnPage && "mt-2")}>
        <div className="mb-4">
          <AccountSheet
            open={sheetOpen}
            onOpenChange={(open) => {
              setSheetOpen(open);
              if (!open) setEditingAccount(null);
            }}
            facilityId={facilityId}
            patientId={patientId}
            initialValues={editingAccount ? editingAccount : undefined}
            isEdit={!!editingAccount}
          />
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <Input
              placeholder={t("search_accounts")}
              value={qParams.search || ""}
              onChange={(e) =>
                updateQuery({ search: e.target.value || undefined })
              }
              className="sm:max-w-xs w-[calc(100%)]"
            />
            <Tabs
              value={qParams.status ?? "all"}
              onValueChange={(value) =>
                updateQuery({ status: value === "all" ? undefined : value })
              }
              className="overflow-y-auto max-w-[calc(100%)]"
            >
              <TabsList>
                <TabsTrigger value="all">{t("all_statuses")}</TabsTrigger>
                {Object.keys(statusColorMap).map((key) => (
                  <TabsTrigger key={key} value={key}>
                    {t(key)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="w-64">
              <Select
                value={qParams.billing_status ?? "all"}
                onValueChange={(value) =>
                  updateQuery({
                    billing_status: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t("all_billing_statuses")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("all_billing_statuses")}
                  </SelectItem>
                  {Object.keys(billingStatusColorMap).map((key) => (
                    <SelectItem key={key} value={key}>
                      {t(key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              {patientId && (
                <Button onClick={() => setSheetOpen(true)}>
                  {t("create_account")}
                </Button>
              )}
            </div>
          </div>
        </div>
        {isLoading ? (
          <TableSkeleton count={5} />
        ) : accounts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("patient")}</TableHead>
                  <TableHead>{t("balance")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("billing_status")}</TableHead>
                  <TableHead>{t("period")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account: AccountRead) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={account.name} className="size-8" />
                        <div>
                          <div className="font-medium">{account.name}</div>
                          <div className="text-xs text-gray-500">
                            {account.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(0)}</TableCell>
                    <TableCell>
                      <Badge variant={statusColorMap[account.status] as any}>
                        {t(account.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          billingStatusColorMap[account.billing_status] as any
                        }
                      >
                        {t(account.billing_status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(account.service_period?.start)}
                      {account.service_period?.end &&
                        ` - ${formatDate(account.service_period?.end)}`}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingAccount(account);
                            setSheetOpen(true);
                          }}
                          aria-label={t("edit")}
                        >
                          <CareIcon icon="l-pen" className="size-4" />
                          <span className="sr-only">{t("edit")}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(
                              `/facility/${facilityId}/billing/account/${account.id}`,
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

export default AccountList;
