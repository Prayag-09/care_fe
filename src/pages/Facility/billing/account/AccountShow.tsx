import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import {
  AccountAggregate,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import { InvoiceRead } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";

import AccountSheet from "./AccountSheet";
import ChargeItemsTable from "./components/ChargeItemsTable";
import InvoicesTable from "./components/InvoicesTable";

const statusMap: Record<AccountStatus, { label: string; color: string }> = {
  active: { label: "active", color: "primary" },
  inactive: { label: "inactive", color: "secondary" },
  entered_in_error: { label: "entered_in_error", color: "destructive" },
  on_hold: { label: "on_hold", color: "outline" },
};

function formatDate(date?: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function AccountShow({
  facilityId,
  accountId,
}: {
  facilityId: string;
  accountId: string;
}) {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = React.useState(false);

  const { data: account, isLoading } = useQuery({
    queryKey: ["account", accountId],
    queryFn: query(accountApi.retrieveAccount, {
      pathParams: { facilityId, accountId },
    }),
  });

  const { data: chargeItems, isLoading: isLoadingChargeItems } = useQuery({
    queryKey: ["chargeItems", accountId],
    queryFn: query(chargeItemApi.listChargeItem, {
      pathParams: { facilityId },
      queryParams: { account: accountId },
    }),
  }) as { data: { results: ChargeItemRead[] } | undefined; isLoading: boolean };

  const { data: invoices, isLoading: isLoadingInvoices } = useQuery({
    queryKey: ["invoices", accountId],
    queryFn: query(invoiceApi.listInvoice, {
      pathParams: { facilityId },
      queryParams: { account: accountId },
    }),
  }) as { data: { results: InvoiceRead[] } | undefined; isLoading: boolean };

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  if (!account) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{t("account_not_found")}</h2>
          <p className="mt-2 text-gray-600">{t("account_may_not_exist")}</p>
          <Button asChild className="mt-4">
            <Link href={`/facility/${facilityId}/billing/accounts`}>
              {t("back_to_accounts")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/facility/${facilityId}/billing/accounts`}>
              <CareIcon icon="l-angle-left" className="size-4" />
            </Link>
          </Button>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            Account {account.id}
            <Badge variant={statusMap[account.status]?.color as any}>
              {t(statusMap[account.status]?.label)}
            </Badge>
          </h1>
        </div>
        <Button variant="outline" onClick={() => setSheetOpen(true)}>
          <CareIcon icon="l-pen" className="mr-2 size-4" />
          {t("edit_account")}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("account_information")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t("patient_and_billing_details")}
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Patient Basic Info */}
              <div className="flex items-start gap-4">
                <Avatar
                  name={account.patient.name}
                  className="size-12 shrink-0"
                />
                <div>
                  <h3 className="text-lg font-medium">
                    {account.patient.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("patient_id")}: {account.patient.id}
                  </p>
                </div>
              </div>

              {/* Description and Personal Details */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 font-medium">{t("description")}</h4>
                  <div className="space-y-2 text-sm">
                    <p>{account.patient.address || "-"}</p>
                    <p>
                      {t("phone")}: {account.patient.phone_number || "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 font-medium">{t("personal_details")}</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      {t("date_of_birth")}:{" "}
                      {formatDate(account.patient.date_of_birth)}
                    </p>
                    <p>
                      {t("gender")}: {t(account.patient.gender)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Summary */}
        <Card>
          <CardHeader>
            <CardTitle>{t("account_summary")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("financial_overview")}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="mb-2 font-medium">{t("account_status")}</h4>
              <div className="flex items-center gap-2">
                <Badge variant="primary">Active</Badge>
                <span className="text-sm text-muted-foreground">
                  {t("since")} {formatDate(account.service_period?.start)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-medium">{t("current_balance")}</h4>
              {account.balances?.map((balance) => {
                if (balance.aggregate === AccountAggregate.total) {
                  const isPositive = balance.amount.value > 0;
                  return (
                    <React.Fragment key={balance.aggregate}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-2xl font-bold ${isPositive ? "text-red-500" : "text-green-500"}`}
                        >
                          {formatCurrency(
                            balance.amount.value,
                            balance.amount.currency,
                          )}
                        </span>
                        {isPositive && (
                          <Badge variant="destructive">
                            {t("outstanding")}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("last_updated")}: {formatDate(account.calculated_at)}
                      </p>
                    </React.Fragment>
                  );
                }
                return null;
              })}
            </div>

            {account.balances?.map((balance) => {
              if (
                balance.aggregate === AccountAggregate.total &&
                balance.amount.value > 0
              ) {
                return (
                  <div
                    key={balance.aggregate}
                    className="rounded-lg bg-muted/50 p-4"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <CareIcon
                        icon="l-clock"
                        className="size-4 text-muted-foreground"
                      />
                      <span className="font-medium">{t("payment_due")}</span>
                    </div>
                    <p className="text-sm">
                      {t("payment_due_message", {
                        amount: formatCurrency(
                          balance.amount.value,
                          balance.amount.currency,
                        ),
                        // Add 30 days to the last calculation date as due date
                        date: formatDate(
                          new Date(
                            new Date(account.calculated_at || "").getTime() +
                              30 * 24 * 60 * 60 * 1000,
                          ).toISOString(),
                        ),
                      })}
                    </p>
                  </div>
                );
              }
              return null;
            })}

            {/* Detailed Balances */}
            <div className="space-y-2">
              {account.balances?.map((balance) => {
                if (balance.aggregate !== AccountAggregate.total) {
                  return (
                    <div
                      key={balance.aggregate}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {t(balance.aggregate)}
                      </span>
                      <span
                        className={
                          balance.amount.value > 0
                            ? "text-red-500"
                            : "text-green-500"
                        }
                      >
                        {formatCurrency(
                          balance.amount.value,
                          balance.amount.currency,
                        )}
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            <div className="space-y-3">
              <Button className="w-full">
                <CareIcon icon="l-file" className="mr-2 size-4" />
                {t("view_statement")}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline">
                  <CareIcon icon="l-print" className="mr-2 size-4" />
                  {t("print")}
                </Button>
                <Button variant="outline">
                  <CareIcon icon="l-export" className="mr-2 size-4" />
                  {t("export")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charge Items Section */}
      <div className="mt-8">
        <ChargeItemsTable
          isLoading={isLoadingChargeItems}
          items={chargeItems?.results}
          onAddClick={() => {
            // TODO: Implement add charge item
            console.log("Add charge item clicked");
          }}
        />
      </div>

      {/* Invoices Section */}
      <div className="mt-8">
        <InvoicesTable
          isLoading={isLoadingInvoices}
          items={invoices?.results}
          facilityId={facilityId}
          onCreateClick={() => {
            // TODO: Implement create invoice
            console.log("Create invoice clicked");
          }}
        />
      </div>

      <AccountSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        facilityId={facilityId}
        initialValues={{
          id: account.id,
          name: account.name,
          description: account.description || undefined,
          status: account.status,
          patient: account.patient,
        }}
        isEdit
      />
    </div>
  );
}

export default AccountShow;
