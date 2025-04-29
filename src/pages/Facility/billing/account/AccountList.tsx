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

import { Avatar } from "@/components/Common/Avatar";
import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  type AccountRead,
  AccountStatus,
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

const statusMap: Record<AccountStatus, { label: string; color: string }> = {
  active: { label: "active", color: "primary" },
  inactive: { label: "inactive", color: "secondary" },
  entered_in_error: { label: "entered_in_error", color: "destructive" },
  on_hold: { label: "on_hold", color: "outline" },
};

function formatCurrency(amount?: number | string) {
  if (amount == null) return "$0.00";
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
}: {
  facilityId: string;
  patientId?: string;
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
      },
    }),
  });

  const accounts = (response?.results as AccountRead[]) || [];

  return (
    <Page title={t("accounts")}>
      <div className="container mx-auto">
        <div className="mb-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                {t("account_management")}
              </h1>
              <p className="text-gray-600 text-sm">
                {t("view_and_manage_accounts")}
              </p>
            </div>
            {patientId && (
              <Button onClick={() => setSheetOpen(true)}>
                {t("create_account")}
              </Button>
            )}
          </div>
          <AccountSheet
            open={sheetOpen}
            onOpenChange={(open) => {
              setSheetOpen(open);
              if (!open) setEditingAccount(null);
            }}
            facilityId={facilityId}
            patientId={patientId}
            initialValues={
              editingAccount
                ? {
                    id: editingAccount.id,
                    name: editingAccount.name,
                    description: editingAccount.description || undefined,
                    status: editingAccount.status,
                    patient: editingAccount.patient,
                  }
                : undefined
            }
            isEdit={!!editingAccount}
          />
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <Input
              placeholder={t("search_accounts")}
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
                    {t(label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <TableHead>{t("start_date")}</TableHead>
                  <TableHead>{t("end_date")}</TableHead>
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
                      <Badge variant={statusMap[account.status]?.color as any}>
                        {t(statusMap[account.status]?.label)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(account.service_period?.start)}
                    </TableCell>
                    <TableCell>
                      {formatDate(account.service_period?.end)}
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
