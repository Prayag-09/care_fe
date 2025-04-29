import { useQuery } from "@tanstack/react-query";
import { Link, navigate } from "raviger";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import PaymentReconciliationSheet from "@/pages/Facility/billing/PaymentReconciliationSheet";
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
  return new Date(date).toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", {
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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);

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
    <div className="space-y-8">
      {/* Account Details Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{account.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {account.description || t("no_description")}
              </p>
            </div>
            <Button variant="outline" onClick={() => setSheetOpen(true)}>
              <CareIcon icon="l-pen" className="mr-2 size-4" />
              {t("edit")}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold">{t("patient_details")}</h3>
                <div className="mt-2 flex items-center gap-4">
                  <Avatar name={account.patient.name} className="size-12" />
                  <div>
                    <div className="font-medium">{account.patient.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {account.patient.phone_number}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold">{t("account_details")}</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t("status")}</span>
                    <Badge variant={statusMap[account.status].color as any}>
                      {t(statusMap[account.status].label)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("start_date")}
                    </span>
                    <span>{formatDate(account.service_period?.start)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("end_date")}
                    </span>
                    <span>{formatDate(account.service_period?.end)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("balance")}</CardTitle>
          </CardHeader>
          <CardContent>
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

            <div className="space-y-2 mt-4">
              <Button className="w-full">
                <CareIcon icon="l-file" className="mr-2 size-4" />
                {t("view_statement")}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsPaymentSheetOpen(true)}
              >
                <CareIcon icon="l-wallet" className="mr-2 size-4" />
                {t("record_payment")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charge Items Section */}
      <div className="mt-8">
        <ChargeItemsTable
          isLoading={isLoadingChargeItems}
          items={chargeItems?.results}
          facilityId={facilityId}
        />
      </div>

      {/* Invoices Section */}
      <div className="mt-8">
        <InvoicesTable
          isLoading={isLoadingInvoices}
          items={invoices?.results}
          accountId={accountId}
          facilityId={facilityId}
          onCreateClick={() => {
            navigate(
              `/facility/${facilityId}/billing/account/${accountId}/invoices/create`,
            );
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

      <PaymentReconciliationSheet
        open={isPaymentSheetOpen}
        onOpenChange={setIsPaymentSheetOpen}
        facilityId={facilityId}
        accountId={accountId}
      />
    </div>
  );
}

export default AccountShow;
