import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, ExternalLink } from "lucide-react";
import { navigate } from "raviger";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import query from "@/Utils/request/query";
import AccountSheet from "@/pages/Facility/billing/account/AccountSheet";
import {
  AccountRead,
  AccountStatus,
  billingStatusColorMap,
  statusColorMap,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import { Encounter } from "@/types/emr/encounter";

interface AccountSheetButtonProps {
  encounter: Encounter;
  trigger: React.ReactNode;
  canWrite: boolean;
}

export function AccountSheetButton({
  encounter,
  trigger,
  canWrite,
}: AccountSheetButtonProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountRead | null>(
    null,
  );

  const {
    data: response,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["accounts", encounter.patient.id],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId: encounter.facility.id },
      queryParams: {
        patient: encounter.patient.id,
        limit: 5,
      },
    }),
    enabled: false,
  });

  const allAccounts = (response?.results as AccountRead[]) || [];

  const accounts = allAccounts.filter(
    (account) => account.status === AccountStatus.active,
  );

  const hasActiveAccount = accounts.length > 0;

  const handleCreateAccountClick = () => {
    setCreateAccountOpen(true);
  };

  const handleEditAccount = (account: AccountRead, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAccount(account);
  };

  const handleViewAccount = (account: AccountRead, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(
      `/facility/${encounter.facility.id}/billing/account/${account.id}`,
    );
  };

  const handleOpenSheet = () => {
    refetch();
    setSheetOpen(true);
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
  };

  return (
    <>
      <div onClick={handleOpenSheet} className="cursor-pointer">
        {trigger}
      </div>

      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t("accounts")}</SheetTitle>
          </SheetHeader>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {accounts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    {t("no_active_accounts_found")}
                  </p>
                  {canWrite && (
                    <Button
                      onClick={handleCreateAccountClick}
                      variant="outline"
                    >
                      {t("create_account")}
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {accounts.map((account) => (
                    <div key={account.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-medium">{account.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={statusColorMap[account.status] as any}
                          >
                            {t(account.status)}
                          </Badge>
                          <Badge
                            variant={
                              billingStatusColorMap[
                                account.billing_status
                              ] as any
                            }
                          >
                            {t(account.billing_status)}
                          </Badge>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => handleViewAccount(account, e)}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t("view_account")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {canWrite && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) =>
                                      handleEditAccount(account, e)
                                    }
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t("edit_account")}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {account.description}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span>{t("balance")}</span>
                        <span
                          className={
                            account.total_balance > 0
                              ? "text-red-600"
                              : "text-green-700"
                          }
                        >
                          {account.total_balance.toLocaleString(undefined, {
                            style: "currency",
                            currency: "INR",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}

                  {canWrite && !hasActiveAccount && (
                    <div className="flex justify-end">
                      <Button
                        onClick={handleCreateAccountClick}
                        variant="outline"
                      >
                        {t("create_new_account")}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AccountSheet
        open={createAccountOpen}
        onOpenChange={(open) => {
          setCreateAccountOpen(open);
          if (!open) {
            queryClient.invalidateQueries({
              queryKey: ["accounts", encounter.patient.id],
            });
            refetch();
          }
        }}
        facilityId={encounter.facility.id}
        patientId={encounter.patient.id}
      />

      <AccountSheet
        open={!!editingAccount}
        onOpenChange={(open) => {
          if (!open) {
            setEditingAccount(null);
            queryClient.invalidateQueries({
              queryKey: ["accounts", encounter.patient.id],
            });
            refetch();
          }
        }}
        facilityId={encounter.facility.id}
        patientId={encounter.patient.id}
        initialValues={editingAccount || undefined}
        isEdit={true}
      />
    </>
  );
}
