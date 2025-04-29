import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { InvoiceCreate, InvoiceStatus } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";

interface EditInvoiceSheetProps {
  facilityId: string;
  invoiceId: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export default function EditInvoiceSheet({
  facilityId,
  invoiceId,
  onSuccess,
  trigger,
}: EditInvoiceSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: query(invoiceApi.retrieveInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
    enabled: open,
  });

  const formSchema = z.object({
    title: z.string().min(1, { message: t("field_required") }),
    status: z.nativeEnum(InvoiceStatus),
    payment_terms: z.string().optional(),
    note: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      status: InvoiceStatus.draft,
      payment_terms: "",
      note: "",
    },
  });

  useEffect(() => {
    if (invoice) {
      form.reset({
        title: invoice.title,
        status: invoice.status,
        payment_terms: invoice.payment_terms || "",
        note: invoice.note || "",
      });
    }
  }, [invoice, form]);

  const { mutate: updateInvoice, isPending } = useMutation({
    mutationFn: mutate(invoiceApi.updateInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
    onSuccess: () => {
      toast.success(t("invoice_updated_successfully"));
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceId] });
      setOpen(false);
      onSuccess?.();
    },
    onError: () => {
      toast.error(t("failed_to_update_invoice"));
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!invoice) return;

    // Get the charge item IDs from the current invoice
    const chargeItemIds = invoice.charge_items.map((item) => item.id);

    // Create the update payload
    // Note: For account, we need to send a string ID representing the account
    // Since this value isn't directly available in the invoice data structure,
    // we'd typically get it from the URL or a parent component
    // For this example, we're using a dummy value that would need to be replaced
    // with the actual account ID in a real implementation
    const data: InvoiceCreate = {
      title: values.title.trim(),
      status: values.status,
      payment_terms: values.payment_terms?.trim() || null,
      note: values.note?.trim() || null,
      // In a real implementation, get the account ID from a parent component or URL
      account: "placeholder-account-id",
      charge_items: chargeItemIds,
    };

    updateInvoice(data);
  };

  const canEdit =
    invoice?.status !== InvoiceStatus.balanced &&
    invoice?.status !== InvoiceStatus.cancelled;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <CareIcon icon="l-pen" className="mr-2 size-4" />
            {t("edit_invoice")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("edit_invoice")}</SheetTitle>
          <SheetDescription>{t("edit_invoice_details")}</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">{t("loading")}</p>
          </div>
        ) : !invoice ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">{t("invoice_not_found")}</p>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 py-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("invoice_title")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("invoice_title_placeholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("status")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!canEdit}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_status")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={InvoiceStatus.draft}>
                          {t("status_draft")}
                        </SelectItem>
                        <SelectItem value={InvoiceStatus.issued}>
                          {t("status_issued")}
                        </SelectItem>
                        <SelectItem value={InvoiceStatus.balanced}>
                          {t("status_balanced")}
                        </SelectItem>
                        <SelectItem value={InvoiceStatus.cancelled}>
                          {t("status_cancelled")}
                        </SelectItem>
                        <SelectItem value={InvoiceStatus.entered_in_error}>
                          {t("status_entered_in_error")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("payment_terms")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t("payment_terms_placeholder")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("note")}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t("invoice_note_placeholder")}
                        className="min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" disabled={isPending || !canEdit}>
                  {isPending ? t("saving...") : t("save_changes")}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
