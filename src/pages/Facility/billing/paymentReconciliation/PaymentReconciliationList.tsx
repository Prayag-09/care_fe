import { navigate, useQueryParams } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import Page from "@/components/Common/Page";

import PaymentsData from "./PaymentsData";

export function PaymentReconciliationList({
  facilityId,
  accountId,
}: {
  facilityId: string;
  accountId?: string;
  hideHeader?: boolean;
}) {
  const { t } = useTranslation();
  const [urlParams] = useQueryParams();
  const urlAccountId = urlParams.accountId;

  // Use the prop accountId if provided, otherwise use from URL params
  const effectiveAccountId = accountId || urlAccountId;

  return (
    <Page title={t("payment_reconciliations")}>
      <div className="container mx-auto">
        <div className="mb-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                {t("payment_reconciliation_management")}
              </h1>
              <p className="text-gray-600 text-sm">
                {accountId
                  ? t("view_and_manage_account_payments")
                  : t("view_and_manage_payments")}
              </p>
            </div>
            {accountId && (
              <Button
                onClick={() =>
                  navigate(
                    `/facility/${facilityId}/billing/account/${accountId}/payments/create`,
                  )
                }
              >
                {t("create_payment")}
              </Button>
            )}
          </div>
          <PaymentsData
            facilityId={facilityId}
            accountId={effectiveAccountId}
            className="rounded-lg border mt-2"
          />
        </div>
      </div>
    </Page>
  );
}

export default PaymentReconciliationList;
