import { useMutation, useQuery } from "@tanstack/react-query";
import { PencilIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  MonetoryComponentRead,
  MonetoryComponentType,
} from "@/types/base/monetoryComponent/monetoryComponent";
import { Code } from "@/types/questionnaire/code";

interface MonetoryComponentFormValues {
  monetory_component_type: MonetoryComponentType;
  code: Code | null;
  factor: number | null;
  amount: number | null;
  title: string;
  valueType: "factor" | "amount";
}

export function BillingSettings({ facilityId }: { facilityId: string }) {
  const { t } = useTranslation();
  const [isEditingComponent, setIsEditingComponent] =
    useState<MonetoryComponentRead | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const form = useForm<MonetoryComponentFormValues>({
    defaultValues: {
      monetory_component_type: MonetoryComponentType.discount,
      code: null,
      factor: null,
      amount: null,
      title: "",
      valueType: "factor",
    },
  });

  const { data: facility, isLoading } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(routes.getPermittedFacility, {
      pathParams: { id: facilityId },
    }),
  });

  const { mutate: updateFacility, isPending } = useMutation({
    mutationFn: mutate(routes.updateFacility, {
      pathParams: { id: facilityId },
    }),
    onSuccess: () => {
      setIsSheetOpen(false);
      setIsEditingComponent(null);
      form.reset();
    },
  });

  if (!facility || isLoading || isPending) {
    return <Loading />;
  }

  const handleSaveComponent = (data: MonetoryComponentFormValues) => {
    const componentData = {
      ...data,
      factor: data.valueType === "factor" ? data.factor : null,
      amount: data.valueType === "amount" ? data.amount : null,
    };

    delete (componentData as any).valueType;

    const updatedComponents = isEditingComponent
      ? facility.discount_monetory_components.map((comp) =>
          comp.title === isEditingComponent.title ? componentData : comp,
        )
      : [...facility.discount_monetory_components, componentData];

    updateFacility({
      discount_monetory_components: updatedComponents,
    } as any);
  };

  const handleEditComponent = (component: MonetoryComponentRead) => {
    const valueType =
      component.factor !== null && component.factor !== undefined
        ? "factor"
        : "amount";

    setIsEditingComponent(component);
    form.reset({
      monetory_component_type: component.monetory_component_type,
      code: component.code || null,
      factor: component.factor || null,
      amount: component.amount || null,
      title: component.title,
      valueType,
    });
    setIsSheetOpen(true);
  };

  const handleAddNewComponent = () => {
    setIsEditingComponent(null);
    form.reset({
      monetory_component_type: MonetoryComponentType.discount,
      code: null,
      factor: null,
      amount: null,
      title: "",
      valueType: "factor",
    });
    setIsSheetOpen(true);
  };

  const formatAmount = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatValue = (component: MonetoryComponentRead) => {
    if (component.factor !== null && component.factor !== undefined) {
      return (
        <div className="flex items-center gap-2">
          <span>{component.factor}%</span>
          <Badge variant="secondary">Factor</Badge>
        </div>
      );
    } else if (component.amount !== null && component.amount !== undefined) {
      return (
        <div className="flex items-center gap-2">
          <span>{formatAmount(component.amount)}</span>
          <Badge variant="secondary">Amount</Badge>
        </div>
      );
    }
    return "-";
  };

  const renderMonetoryComponents = (
    components: MonetoryComponentRead[],
    canEdit = false,
  ) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("billing.component_title")}</TableHead>
          <TableHead>{t("billing.component_type")}</TableHead>
          <TableHead>{t("billing.value")}</TableHead>
          <TableHead>{t("billing.component_code")}</TableHead>
          {canEdit && (
            <TableHead className="w-16">{t("common.actions")}</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {components.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={canEdit ? 5 : 4}
              className="text-center text-muted-foreground"
            >
              {t("billing.no_components")}
            </TableCell>
          </TableRow>
        ) : (
          components.map((component, index) => (
            <TableRow key={`${component.title}-${index}`}>
              <TableCell>{component.title}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    component.monetory_component_type ===
                    MonetoryComponentType.discount
                      ? "primary"
                      : "default"
                  }
                >
                  {component.monetory_component_type}
                </Badge>
              </TableCell>
              <TableCell>{formatValue(component)}</TableCell>
              <TableCell>
                {component.code
                  ? `${component.code.code} (${component.code.display})`
                  : "-"}
              </TableCell>
              {canEdit && (
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditComponent(component)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const valueType = form.watch("valueType");

  return (
    <Page title={t("billing.settings_title")}>
      <span>{t("billing.settings_description")}</span>
      <hr className="my-4" />

      <div className="grid gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("billing.discount_components")}</CardTitle>
            <Button variant="outline" size="sm" onClick={handleAddNewComponent}>
              <PlusIcon className="h-4 w-4 mr-2" />
              {t("billing.add_component")}
            </Button>
          </CardHeader>
          <CardContent>
            {renderMonetoryComponents(
              facility.discount_monetory_components || [],
              true,
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("billing.instance_discount_components")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("billing.instance_components_description")}
            </p>
          </CardHeader>
          <CardContent>
            {renderMonetoryComponents(
              facility.instance_discount_monetory_components || [],
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {isEditingComponent
                ? t("billing.edit_component")
                : t("billing.add_component")}
            </SheetTitle>
            <SheetDescription>
              {t("billing.component_form_description")}
            </SheetDescription>
          </SheetHeader>

          <div className="py-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSaveComponent)}
                className="space-y-4"
              >
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

                <FormField
                  control={form.control}
                  name="monetory_component_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("billing.component_type")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={t("billing.select_component_type")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={MonetoryComponentType.discount}>
                            {t("billing.discount")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valueType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>{t("billing.value_type")}</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="factor" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {t("billing.factor")}
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="amount" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {t("billing.amount")}
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {valueType === "factor" ? (
                  <FormField
                    control={form.control}
                    name="factor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t("billing.discount_factor")} (%)
                        </FormLabel>
                        <FormControl>
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
                          />
                        </FormControl>
                        <FormDescription>
                          {t("billing.factor_range_description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("billing.discount_amount")}</FormLabel>
                        <FormControl>
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
                          />
                        </FormControl>
                        <FormDescription>
                          {t("billing.amount_min_description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <SheetFooter>
                  <Button type="submit">
                    {isEditingComponent ? t("common.save") : t("common.add")}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>
    </Page>
  );
}
