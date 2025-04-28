import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
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
  type AccountBase,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";

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
  return Number(amount).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(date?: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AccountList({ facilityId }: { facilityId: string }) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["accounts", qParams],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId },
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        search: qParams.search,
        status: qParams.status,
      },
    }),
  });

  const accounts = (response?.results as AccountBase[]) || [];

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
          </div>
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
              value={qParams.status}
              onValueChange={(value) => updateQuery({ status: value })}
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
            {/* Facility filter can be added here if needed */}
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
                  <TableHead>{t("account_id")}</TableHead>
                  <TableHead>{t("facility")}</TableHead>
                  <TableHead>{t("balance")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>{t("start_date")}</TableHead>
                  <TableHead>{t("last_updated")}</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account: AccountBase) => (
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
                    <TableCell>{account.id}</TableCell>
                    <TableCell>???{t("main_hospital")}</TableCell>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          navigate(
                            `/facility/${facilityId}/account/${account.id}`,
                          )
                        }
                        aria-label={t("view")}
                      >
                        <CareIcon icon="l-user" className="size-4" />
                        <span className="sr-only">{t("view")}</span>
                      </Button>
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
