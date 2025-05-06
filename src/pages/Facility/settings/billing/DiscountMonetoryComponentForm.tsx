import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
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
  MonetoryComponentRead,
  MonetoryComponentType,
} from "@/types/base/monetoryComponent/monetoryComponent";
import { Code, CodeSchema } from "@/types/questionnaire/code";

const formSchema = z
  .object({
    monetory_component_type: z.literal(MonetoryComponentType.discount),
    code: CodeSchema.nullable().optional(),
    factor: z.number().min(0).max(100).nullable().optional(),
    amount: z.number().min(0).nullable().optional(),
    title: z.string().min(1, { message: "field_required" }),
  })
  .refine((data) => data.factor != null || data.amount != null, {
    message: "Either factor or amount must be provided",
    path: ["factor", "amount"],
  });

interface DiscountMonetoryComponentFormProps {
  defaultValues?: MonetoryComponentRead;
  onSubmit: (data: MonetoryComponentRead) => void;
  systemCodes: Code[];
  facilityCodes: Code[];
}

export function DiscountMonetoryComponentForm({
  defaultValues,
  onSubmit,
}: DiscountMonetoryComponentFormProps) {
  const { t } = useTranslation();
  const [valueType, setValueType] = useState<"factor" | "amount">(
    defaultValues?.factor != null ? "factor" : "amount",
  );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      monetory_component_type: MonetoryComponentType.discount,
      code: defaultValues?.code || null,
      factor: defaultValues?.factor || null,
      amount: defaultValues?.amount || null,
      title: defaultValues?.title || "",
    },
  });

  const handleValueTypeChange = (value: "factor" | "amount") => {
    setValueType(value);
    if (value === "factor") {
      form.setValue("amount", null);
    } else {
      form.setValue("factor", null);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("billing.component_title")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>{t("billing.value")}</FormLabel>
          <div className="flex gap-1">
            <div className="flex-2">
              {valueType === "factor" ? (
                <FormField
                  control={form.control}
                  name="factor"
                  render={({ field }) => (
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            )
                          }
                          value={field.value === null ? "" : field.value}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          %
                        </span>
                      </div>
                    </FormControl>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          ₹
                        </span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : null,
                            )
                          }
                          value={field.value === null ? "" : field.value}
                          className="pl-8"
                        />
                      </div>
                    </FormControl>
                  )}
                />
              )}
            </div>
            <Select value={valueType} onValueChange={handleValueTypeChange}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="factor">{t("billing.factor")}</SelectItem>
                <SelectItem value="amount">{t("billing.amount")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <FormDescription>
            {valueType === "factor"
              ? t("billing.factor_range_description")
              : t("billing.amount_min_description")}
          </FormDescription>
          <FormMessage />
        </FormItem>

        <div className="pt-2">
          <Button type="submit">{t("save")}</Button>
        </div>
      </form>
    </Form>
  );
}
