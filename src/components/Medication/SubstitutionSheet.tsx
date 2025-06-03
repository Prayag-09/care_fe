import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import {
  SubstitutionReason,
  SubstitutionType,
} from "@/types/emr/medicationDispense/medicationDispense";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";

interface SubstitutionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalProductKnowledge: ProductKnowledgeBase | undefined;
  currentSubstitution?: {
    substitutedProductKnowledge?: ProductKnowledgeBase;
    type?: SubstitutionType;
    reason?: SubstitutionReason;
  };
  onSave: (
    substitutionDetails?: {
      substitutedProductKnowledge: ProductKnowledgeBase;
      type: SubstitutionType;
      reason: SubstitutionReason;
    } | null, // null to clear substitution
  ) => void;
  facilityId: string;
}

const substitutionSchema = z.object({
  substitutedProductKnowledge: z.any().refine((val) => val?.id, {
    message: "Product selection is required",
  }),
  type: z.nativeEnum(SubstitutionType),
  reason: z.nativeEnum(SubstitutionReason),
});

type SubstitutionFormValues = z.infer<typeof substitutionSchema>;

const getSubstitutionTypeDisplay = (
  t: (key: string) => string,
  type: SubstitutionType,
) => {
  switch (type) {
    case SubstitutionType.E:
      return t("substitution_type_e_equivalence");
    case SubstitutionType.EC:
      return t("substitution_type_ec_equivalence_clinical");
    case SubstitutionType.BC:
      return t("substitution_type_bc_brand_change");
    case SubstitutionType.G:
      return t("substitution_type_g_generic");
    case SubstitutionType.TE:
      return t("substitution_type_te_therapeutic_equivalence");
    case SubstitutionType.TB:
      return t("substitution_type_tb_therapeutic_brand");
    case SubstitutionType.TG:
      return t("substitution_type_tg_therapeutic_generic");
    case SubstitutionType.F:
      return t("substitution_type_f_formulary");
    case SubstitutionType.N:
      return t("substitution_type_n_none");
    default:
      return type;
  }
};

const getSubstitutionReasonDisplay = (
  t: (key: string) => string,
  reason: SubstitutionReason,
) => {
  switch (reason) {
    case SubstitutionReason.CT:
      return t("substitution_reason_ct");
    case SubstitutionReason.FP:
      return t("substitution_reason_fp");
    case SubstitutionReason.OS:
      return t("substitution_reason_os");
    case SubstitutionReason.RR:
      return t("substitution_reason_rr");
    default:
      return reason;
  }
};

export function SubstitutionSheet({
  open,
  onOpenChange,
  originalProductKnowledge,
  currentSubstitution,
  onSave,
  facilityId,
}: SubstitutionSheetProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubstitute, setSelectedSubstitute] = useState<
    ProductKnowledgeBase | undefined
  >(currentSubstitution?.substitutedProductKnowledge);
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });

  const form = useForm<SubstitutionFormValues>({
    resolver: zodResolver(substitutionSchema),
    defaultValues: {
      substitutedProductKnowledge:
        currentSubstitution?.substitutedProductKnowledge || undefined,
      type: currentSubstitution?.type,
      reason: currentSubstitution?.reason,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        substitutedProductKnowledge:
          currentSubstitution?.substitutedProductKnowledge || undefined,
        type: currentSubstitution?.type,
        reason: currentSubstitution?.reason,
      });
      setSelectedSubstitute(currentSubstitution?.substitutedProductKnowledge);
      setSearchTerm(
        currentSubstitution?.substitutedProductKnowledge?.name || "",
      );
    }
  }, [open, currentSubstitution, form]);

  useEffect(() => {
    form.setValue("substitutedProductKnowledge", selectedSubstitute, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [selectedSubstitute, form]);

  const { data: productKnowledges, isLoading: isProductLoading } = useQuery({
    queryKey: ["productKnowledge", "medication", searchTerm, facilityId],
    queryFn: query.debounced(productKnowledgeApi.listProductKnowledge, {
      queryParams: {
        facility: facilityId,
        limit: 20,
        offset: 0,
        name: searchTerm,
        product_type: "medication",
        status: "active",
      },
    }),
    enabled: searchTerm.length >= 3,
  });

  const onSubmit = (values: SubstitutionFormValues) => {
    if (!values.substitutedProductKnowledge) return;
    onSave({
      substitutedProductKnowledge: values.substitutedProductKnowledge,
      type: values.type,
      reason: values.reason,
    });
    onOpenChange(false);
  };

  const handleProductSelect = (product: ProductKnowledgeBase) => {
    setSelectedSubstitute(product);
    setSearchTerm(product.name);
    setProductPopoverOpen(false);
  };

  const handlePopoverOpenChange = (isOpen: boolean) => {
    setProductPopoverOpen(isOpen);
    if (!isOpen) {
      setSearchTerm(selectedSubstitute?.name || "");
    }
  };

  const renderProductSelector = (className?: string) => {
    return (
      <Command className={className}>
        <div className="flex flex-col px-3 py-2 border-b sticky top-0 bg-white z-10">
          <span className="font-semibold text-base text-gray-900">
            {t("search_substitute_medications")}
          </span>
          <span className="text-sm text-gray-500 mt-0.5">
            {t("type_at_least_3_characters_to_search")}
          </span>
        </div>
        <div className="flex items-center border-b px-3 sticky top-[48px] bg-white z-10">
          <CommandInput
            placeholder={t("search_products")}
            onValueChange={setSearchTerm}
            value={searchTerm}
            className="border-none focus:ring-0"
          />
        </div>
        <CommandList
          className="max-h-[calc(100vh-20rem)]"
          onWheel={(e) => e.stopPropagation()}
        >
          <CommandEmpty>
            {isProductLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                <span className="ml-2 text-sm text-gray-500">
                  {t("searching")}
                </span>
              </div>
            ) : searchTerm.length < 3 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">
                  {t("type_at_least_3_characters_to_search")}
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm font-medium">{t("no_products_found")}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("try_different_search_terms")}
                </p>
              </div>
            )}
          </CommandEmpty>
          <CommandGroup>
            {!isProductLoading &&
              productKnowledges?.results?.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => handleProductSelect(product)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center">
                    <span>{product.name}</span>
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>
        </CommandList>
      </Command>
    );
  };

  if (!originalProductKnowledge) return null;

  const handleClearSubstitution = () => {
    onSave(null); // Pass null to indicate clearing
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full flex-col sm:max-w-2xl">
        <SheetHeader className="space-y-3 pb-6">
          <SheetTitle className="text-xl font-semibold">
            {t("substitute_medication")}
          </SheetTitle>
          <SheetDescription className="text-base">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>{t("substituting_for")}:</span>
                <Badge variant="secondary" className="font-medium">
                  {originalProductKnowledge.name}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("select_alternative_medication_and_provide_details")}
              </p>
            </div>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Product Selection */}
              <FormField
                control={form.control}
                name="substitutedProductKnowledge"
                render={() => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium">
                      {t("select_substitute_product")}
                      <span className="text-destructive ml-1">*</span>
                    </FormLabel>

                    <div className="space-y-3">
                      {/* Product Selector Button */}
                      {isMobile ? (
                        <>
                          <Sheet
                            open={productPopoverOpen}
                            onOpenChange={setProductPopoverOpen}
                          >
                            <SheetTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={productPopoverOpen}
                                className="w-full justify-between h-12 border-dashed"
                                type="button"
                              >
                                <span className="truncate text-left">
                                  {selectedSubstitute
                                    ? selectedSubstitute.name
                                    : t("search_and_select_product")}
                                </span>
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="p-0" side="bottom">
                              {renderProductSelector("mb-12")}
                            </SheetContent>
                          </Sheet>
                        </>
                      ) : (
                        <Popover
                          open={productPopoverOpen}
                          onOpenChange={handlePopoverOpenChange}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={productPopoverOpen}
                              className="w-full justify-between h-12 border-dashed"
                              type="button"
                            >
                              <span className="truncate text-left">
                                {selectedSubstitute
                                  ? selectedSubstitute.name
                                  : t("search_and_select_product")}
                              </span>
                              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            sideOffset={4}
                            className="p-0 w-[var(--radix-popover-trigger-width)] max-h-[80vh] overflow-auto"
                          >
                            {renderProductSelector()}
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Substitution Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium">
                      {t("substitution_type")}
                      <span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={t("select")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(SubstitutionType).map((type) => (
                          <SelectItem key={type} value={type} className="py-3">
                            <div className="space-y-1">
                              <p className="font-medium">
                                {getSubstitutionTypeDisplay(t, type)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {type}
                              </p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Substitution Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-medium">
                      {t("substitution_reason")}
                      <span className="text-destructive ml-1">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={t("select")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(SubstitutionReason).map((reason) => (
                          <SelectItem
                            key={reason}
                            value={reason}
                            className="py-3"
                          >
                            <div className="space-y-1">
                              <p className="font-medium">
                                {getSubstitutionReasonDisplay(t, reason)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {reason}
                              </p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>

        <SheetFooter className="border-t pt-6">
          <div className="flex w-full justify-between gap-3">
            <div className="flex gap-3 flex-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleClearSubstitution}
                disabled={
                  !currentSubstitution?.substitutedProductKnowledge &&
                  !selectedSubstitute
                }
                className="flex-1 sm:flex-initial"
              >
                {t("clear")}
              </Button>
              <SheetClose asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 sm:flex-initial"
                >
                  {t("cancel")}
                </Button>
              </SheetClose>
              <Button
                type="submit"
                onClick={form.handleSubmit(onSubmit)}
                disabled={!form.formState.isValid || !selectedSubstitute}
                className="flex-1 sm:flex-initial"
              >
                {t("save")}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
