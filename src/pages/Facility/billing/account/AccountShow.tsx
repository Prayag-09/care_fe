import { DialogDescription } from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Avatar } from "@/components/Common/Avatar";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import PaymentReconciliationSheet from "@/pages/Facility/billing/PaymentReconciliationSheet";
import InvoicesData from "@/pages/Facility/billing/invoice/InvoicesData";
import PaymentsData from "@/pages/Facility/billing/paymentReconciliation/PaymentsData";
import {
  AccountBillingStatus,
  AccountStatus,
  closeBillingStatusColorMap,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";

import AccountSheet from "./AccountSheet";
import ChargeItemsTable from "./components/ChargeItemsTable";

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

type tab = "charge_items" | "invoices" | "payments";

const closedStatusText = {
  [AccountBillingStatus.closed_baddebt]: "close_account_help_closed_baddebt",
  [AccountBillingStatus.closed_voided]: "close_account_help_closed_voided",
  [AccountBillingStatus.closed_completed]:
    "close_account_help_closed_completed",
  [AccountBillingStatus.closed_combined]: "close_account_help_closed_combined",
};

export function AccountShow({
  facilityId,
  accountId,
  tab,
}: {
  facilityId: string;
  accountId: string;
  tab: tab;
}) {
  const { t } = useTranslation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const queryClient = useQueryClient();
  const [closeAccountStatus, setCloseAccountStatus] = useState<{
    sheetOpen: boolean;
    reason: AccountBillingStatus;
  }>({ sheetOpen: false, reason: AccountBillingStatus.closed_baddebt });

  const { data: account, isLoading } = useQuery({
    queryKey: ["account", accountId],
    queryFn: query(accountApi.retrieveAccount, {
      pathParams: { facilityId, accountId },
    }),
  });

  const isAccountBillingClosed =
    account?.billing_status === AccountBillingStatus.closed_baddebt ||
    account?.billing_status === AccountBillingStatus.closed_voided ||
    account?.billing_status === AccountBillingStatus.closed_completed ||
    account?.billing_status === AccountBillingStatus.closed_combined;

  useEffect(() => {
    if (account) {
      setCloseAccountStatus({
        sheetOpen: false,
        reason: isAccountBillingClosed
          ? account?.billing_status
          : AccountBillingStatus.closed_baddebt,
      });
    }
  }, [account]);

  const rebalanceMutation = useMutation({
    mutationFn: mutate(accountApi.rebalanceAccount, {
      pathParams: { facilityId, accountId },
    }),
    onSuccess: () => {
      toast.success(t("account_rebalanced_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["account", accountId],
      });
    },
    onError: (_error) => {
      toast.error(t("account_rebalance_failed"));
    },
  });

  const { mutate: closeAccount } = useMutation({
    mutationFn: mutate(accountApi.updateAccount, {
      pathParams: { facilityId, accountId },
    }),
    onSuccess: () => {
      toast.success(t("account_closed_successfully"));
      queryClient.invalidateQueries({
        queryKey: ["account", accountId],
      });
    },
  });

  const handleCloseAccount = () => {
    closeAccount({
      id: accountId,
      name: account?.name || "",
      description: account?.description,
      status: AccountStatus.inactive,
      billing_status: closeAccountStatus.reason,
      service_period: {
        start: account?.service_period?.start || new Date().toISOString(),
        end: new Date().toISOString(),
      },
      patient: account?.patient?.id || "",
    });
    setCloseAccountStatus({
      sheetOpen: false,
      reason: AccountBillingStatus.closed_baddebt,
    });
  };

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
              <p className="text-sm text-gray-500">
                {account.description || t("no_description")}
              </p>
            </div>
            <div className="flex flex-row gap-2">
              <Button variant="outline" onClick={() => setSheetOpen(true)}>
                <CareIcon icon="l-pen" className="mr-2 size-4" />
                {t("edit")}
              </Button>
              {account.status === AccountStatus.active &&
                !isAccountBillingClosed && (
                  <Button
                    variant="destructive"
                    onClick={() =>
                      setCloseAccountStatus({
                        ...closeAccountStatus,
                        sheetOpen: true,
                      })
                    }
                  >
                    <CareIcon icon="l-trash" className="mr-2 size-4" />
                    {t("close_account")}
                  </Button>
                )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="font-semibold">{t("patient_details")}</h3>
                <div className="mt-2 flex items-center gap-4">
                  <Avatar name={account.patient.name} className="size-12" />
                  <div>
                    <div className="font-medium">{account.patient.name}</div>
                    <div className="text-sm text-gray-500">
                      {account.patient.phone_number}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold">{t("account_details")}</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{t("status")}</span>
                    <Badge variant={statusMap[account.status].color as any}>
                      {t(statusMap[account.status].label)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{t("start_date")}</span>
                    <span>{formatDate(account.service_period?.start)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{t("end_date")}</span>
                    <span>{formatDate(account.service_period?.end)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              {t("account_summary")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex flex-col justify-between text-sm">
                <span className="text-base font-medium text-gray-500">
                  {t("total_balance")}
                </span>
                <span
                  className={cn(
                    account.total_balance > 0
                      ? "text-red-600"
                      : "text-green-600",
                    "text-xl font-bold px-1",
                  )}
                >
                  <MonetaryDisplay amount={account.total_balance} />
                </span>
              </div>
              <div className="flex flex-col justify-between text-sm">
                <span className="text-base font-medium text-gray-500">
                  {t("total_gross")}
                </span>
                <span className={cn("text-xl font-bold px-1")}>
                  <MonetaryDisplay amount={account.total_gross} />
                </span>
              </div>
              <div className="flex flex-col justify-between text-sm">
                <span className="text-base font-medium text-gray-500">
                  {t("total_net")}
                </span>
                <span className={cn("text-xl font-bold px-1")}>
                  <MonetaryDisplay amount={account.total_net} />
                </span>
              </div>
              <div className="flex flex-col justify-between text-sm">
                <span className="text-base font-medium text-gray-500">
                  {t("total_paid")}
                </span>
                <span className={cn("text-xl font-bold px-1")}>
                  <MonetaryDisplay amount={account.total_paid} />
                </span>
              </div>
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
              <Button
                variant="secondary"
                className="w-full"
                disabled={rebalanceMutation.isPending}
                onClick={() => rebalanceMutation.mutate({})}
              >
                <CareIcon icon="l-refresh" className="mr-2 size-4" />
                {rebalanceMutation.isPending
                  ? t("rebalancing")
                  : t("rebalance")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs
        value={tab}
        onValueChange={(value) =>
          navigate(
            `/facility/${facilityId}/billing/account/${accountId}/${value}`,
          )
        }
        className="mt-8"
      >
        <div className="flex flex-row justify-between items-center">
          <TabsList>
            <TabsTrigger value="invoices">{t("invoices")}</TabsTrigger>
            <TabsTrigger value="charge_items">{t("charge_items")}</TabsTrigger>
            <TabsTrigger value="payments">{t("payments")}</TabsTrigger>
          </TabsList>

          <Button
            variant="outline"
            onClick={() =>
              navigate(
                `/facility/${facilityId}/billing/account/${accountId}/invoices/create`,
              )
            }
          >
            <CareIcon icon="l-plus" className="mr-2 size-4" />
            {t("create_invoice")}
          </Button>
        </div>

        <TabsContent value="charge_items" className="mt-4">
          <ChargeItemsTable facilityId={facilityId} accountId={accountId} />
        </TabsContent>

        <TabsContent value="invoices" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("invoices")}</CardTitle>
                <p className="text-sm text-gray-500">
                  {accountId
                    ? t("billing_statements")
                    : t("view_and_manage_invoices")}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <InvoicesData facilityId={facilityId} accountId={accountId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{t("payments")}</CardTitle>
                <p className="text-sm text-gray-500">
                  {accountId
                    ? t("payment_transactions")
                    : t("view_and_manage_payments")}
                </p>
              </div>
              <Button onClick={() => setIsPaymentSheetOpen(true)}>
                <CareIcon icon="l-plus" className="mr-2 size-4" />
                {t("record_payment")}
              </Button>
            </CardHeader>
            <CardContent>
              <PaymentsData facilityId={facilityId} accountId={accountId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AccountSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        facilityId={facilityId}
        initialValues={account}
        isEdit
      />

      <PaymentReconciliationSheet
        open={isPaymentSheetOpen}
        onOpenChange={setIsPaymentSheetOpen}
        facilityId={facilityId}
        accountId={accountId}
      />

      <Dialog
        open={closeAccountStatus.sheetOpen}
        onOpenChange={(open) =>
          setCloseAccountStatus({ ...closeAccountStatus, sheetOpen: open })
        }
      >
        <DialogHeader></DialogHeader>
        <DialogContent>
          <DialogTitle>{t("close_account")}</DialogTitle>
          <DialogDescription className="text-xs text-gray-500 -mt-1">
            {t(
              closedStatusText[
                closeAccountStatus.reason as keyof typeof closedStatusText
              ],
            )}
          </DialogDescription>
          <Select
            value={closeAccountStatus.reason}
            onValueChange={(value) =>
              setCloseAccountStatus({
                ...closeAccountStatus,
                reason: value as AccountBillingStatus,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(closeBillingStatusColorMap).map((key) => (
                <SelectItem key={key} value={key}>
                  {t(key)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ClosedCallout balance={account.total_balance} />
          <Button variant="destructive" onClick={handleCloseAccount}>
            {t("close_account")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const ClosedCallout = ({ balance }: { balance: number }) => {
  const { t } = useTranslation();
  const isNegative = balance > 0;
  if (!isNegative) return <></>;
  return (
    <span className="text-red-500 bg-red-50 text-xs -mt-2 p-2 rounded">
      <p>{t("close_account_negative_balance")}</p>
    </span>
  );
};

export default AccountShow;
