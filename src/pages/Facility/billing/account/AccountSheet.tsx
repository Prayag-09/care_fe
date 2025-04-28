import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import query from "@/Utils/request/query";
import {
  AccountBillingStatus,
  type AccountRead,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import { Patient } from "@/types/emr/newPatient";

interface AccountFormValues {
  name: string;
  description?: string;
  status: AccountStatus;
  id?: string;
  patient?: Patient;
}

const statusMap: Record<AccountStatus, { label: string; color: string }> = {
  active: { label: "active", color: "primary" },
  inactive: { label: "inactive", color: "secondary" },
  entered_in_error: { label: "entered_in_error", color: "destructive" },
  on_hold: { label: "on_hold", color: "outline" },
};

interface AccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  patientId?: string;
  initialValues?: Partial<AccountFormValues>;
  isEdit?: boolean;
}

export function AccountSheet({
  open,
  onOpenChange,
  facilityId,
  patientId,
  initialValues,
  isEdit,
}: AccountSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const methods = useForm<AccountFormValues>({
    defaultValues: initialValues || {
      name: "",
      description: "",
      status: AccountStatus.active,
    },
  });

  // Reset form when initialValues changes
  React.useEffect(() => {
    if (initialValues) {
      methods.reset(initialValues);
    }
  }, [initialValues, methods]);

  const createMutation = useMutation<AccountRead, unknown, AccountFormValues>({
    mutationFn: (data: AccountFormValues) =>
      query(accountApi.createAccount, {
        pathParams: { facilityId },
        body: {
          ...data,
          patient: patientId!,
          billing_status: AccountBillingStatus.open,
          service_period: {
            start: new Date().toISOString(),
          },
          description: data.description ?? null,
        },
      })({ signal: new AbortController().signal }),
    onSuccess: () => {
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const updateMutation = useMutation<AccountRead, unknown, AccountFormValues>({
    mutationFn: (data) =>
      query(accountApi.updateAccount, {
        pathParams: { facilityId, accountId: data.id! },
        body: {
          id: data.id!,
          name: data.name,
          description: data.description ?? null,
          status: data.status,
          billing_status: AccountBillingStatus.open,
          service_period: {
            start: new Date().toISOString(),
          },
          patient: data.patient?.id || patientId!,
        },
      })({ signal: new AbortController().signal }),
    onSuccess: () => {
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({
        queryKey: ["account", initialValues?.id],
      });
    },
  });

  const onSubmit = (values: AccountFormValues) => {
    if (isEdit && initialValues?.id) {
      updateMutation.mutate({ ...values, id: initialValues.id });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>
            {isEdit ? t("edit_account") : t("create_account")}
          </SheetTitle>
        </SheetHeader>
        <FormProvider {...methods}>
          <Form {...methods}>
            <form
              onSubmit={methods.handleSubmit(onSubmit)}
              className="space-y-6 py-6"
            >
              <FormField
                name="name"
                control={methods.control}
                rules={{ required: t("name_required") }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("account_name")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={createMutation.status === "pending"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="description"
                control={methods.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        disabled={createMutation.status === "pending"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="status"
                control={methods.control}
                rules={{ required: t("status_required") }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("status")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={createMutation.status === "pending"}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusMap).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>
                              {t(label)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <SheetFooter>
                <Button
                  type="submit"
                  disabled={createMutation.status === "pending"}
                >
                  {isEdit ? t("update") : t("create")}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}

export default AccountSheet;
