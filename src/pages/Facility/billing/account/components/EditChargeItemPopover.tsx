import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import mutate from "@/Utils/request/mutate";
import {
  ChargeItemRead,
  ChargeItemStatus,
  ChargeItemUpdate,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.nativeEnum(ChargeItemStatus),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditChargeItemPopoverProps {
  facilityId: string;
  item: ChargeItemRead;
}

export function EditChargeItemPopover({
  facilityId,
  item,
}: EditChargeItemPopoverProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: item.title,
      description: item.description || undefined,
      status: item.status,
      quantity: item.quantity,
      note: item.note || undefined,
    },
  });

  const { mutate: updateChargeItem, isPending } = useMutation({
    mutationFn: (data: FormValues) => {
      const updateData: ChargeItemUpdate = {
        ...data,
        id: item.id,
        unit_price_component: item.unit_price_component,
        override_reason: item.override_reason,
      };
      return mutate(chargeItemApi.updateChargeItem, {
        pathParams: { facilityId, chargeItemId: item.id },
      })(updateData);
    },
    onSuccess: (response) => {
      console.log("Mutation success:", response);
      toast.success(t("charge_item_updated"));
      queryClient.invalidateQueries({ queryKey: ["chargeItems"] });
      setIsOpen(false);
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast.error(error.message || t("error_updating_charge_item"));
    },
  });

  function onSubmit(data: FormValues) {
    console.log("Form submitted with data:", data);
    updateChargeItem(data);
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <CareIcon icon="l-pen" className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">{t("edit_charge_item")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("edit_charge_item_description")}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("title")}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} />
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
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t("select_status")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(ChargeItemStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {t(status)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("quantity")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                      <Textarea {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? t("saving") : t("save_changes")}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default EditChargeItemPopover;
