import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { navigate } from "raviger";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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

import Page from "@/components/Common/Page";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import ProductApi from "@/types/inventory/product/ProductApi";
import {
  ProductCreate,
  ProductRead,
  ProductStatusOptions,
  ProductUpdate,
} from "@/types/inventory/product/product";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";

const formSchema = z.object({
  status: z.nativeEnum(ProductStatusOptions),
  product_knowledge: z.string().min(1, "Product Knowledge is required"),
  charge_item_definition: z.string().optional(),
  batch: z
    .object({
      lot_number: z.string().optional(),
    })
    .optional(),
  expiration_date: z.date().optional(),
});

export default function ProductForm({
  facilityId,
  productId,
  onSuccess,
}: {
  facilityId: string;
  productId?: string;
  onSuccess?: () => void;
}) {
  const { t } = useTranslation();

  const isEditMode = Boolean(productId);

  const { data: existingData, isFetching } = useQuery({
    queryKey: ["product", productId],
    queryFn: query(ProductApi.retrieveProduct, {
      pathParams: {
        facilityId,
        productId: productId!,
      },
    }),
    enabled: isEditMode,
  });

  if (isEditMode && isFetching) {
    return (
      <Page title={t("edit_product")} hideTitleOnPage>
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("edit_product")}
            </h1>
          </div>
          <FormSkeleton rows={6} />
        </div>
      </Page>
    );
  }

  return (
    <ProductFormContent
      facilityId={facilityId}
      productId={productId}
      existingData={existingData}
      onSuccess={onSuccess}
    />
  );
}

function ProductFormContent({
  facilityId,
  productId,
  existingData,
  onSuccess = () => navigate(`/facility/${facilityId}/settings/product`),
}: {
  facilityId: string;
  productId?: string;
  existingData?: ProductRead;
  onSuccess?: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(productId);

  // Get product knowledge list for the dropdown
  const { data: productKnowledgeResponse } = useQuery({
    queryKey: ["productKnowledge"],
    queryFn: query(productKnowledgeApi.listProductKnowledge, {
      queryParams: {
        facility: facilityId,
        limit: 100,
      },
    }),
  });

  const productKnowledgeOptions = productKnowledgeResponse?.results || [];

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues:
      isEditMode && existingData
        ? {
            status: existingData.status,
            product_knowledge: existingData.product_knowledge.id,
            charge_item_definition: existingData.charge_item_definition?.id,
            batch: existingData.batch || undefined,
            expiration_date: existingData.expiration_date
              ? new Date(existingData.expiration_date)
              : undefined,
          }
        : {
            status: ProductStatusOptions.active,
          },
  });

  const { mutate: createProduct, isPending: isCreating } = useMutation({
    mutationFn: mutate(ProductApi.createProduct, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(t("product_created_successfully"));
      onSuccess();
    },
  });

  const { mutate: updateProduct, isPending: isUpdating } = useMutation({
    mutationFn: mutate(ProductApi.updateProduct, {
      pathParams: {
        facilityId,
        productId: productId || "",
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({
        queryKey: ["product", productId],
      });
      toast.success(t("product_updated_successfully"));
      navigate(`/facility/${facilityId}/settings/product`);
    },
  });

  const isPending = isCreating || isUpdating;

  function onSubmit(data: z.infer<typeof formSchema>) {
    // Format the data for API submission
    const formattedData = {
      ...data,
      expiration_date: data.expiration_date
        ? format(data.expiration_date, "yyyy-MM-dd")
        : undefined,
    };

    if (isEditMode && productId) {
      const updatePayload: ProductUpdate = {
        id: productId,
        status: formattedData.status,
        batch: formattedData.batch,
        expiration_date: formattedData.expiration_date,
        charge_item_definition: formattedData.charge_item_definition,
        product_knowledge: formattedData.product_knowledge,
      };
      updateProduct(updatePayload);
    } else {
      const createPayload: ProductCreate = {
        status: formattedData.status,
        batch: formattedData.batch,
        expiration_date: formattedData.expiration_date,
        product_knowledge: formattedData.product_knowledge,
        charge_item_definition: formattedData.charge_item_definition,
      };
      createProduct(createPayload);
    }
  }

  return (
    <Page
      title={isEditMode ? t("edit_product") : t("create_product")}
      hideTitleOnPage
    >
      <div className="container mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            {isEditMode ? t("edit_product") : t("create_product")}
          </h1>
          {isEditMode && (
            <p className="text-sm text-gray-500">
              {t("edit_product_description")}
            </p>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="space-y-4">
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
                          {Object.values(ProductStatusOptions).map((status) => (
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

                {!isEditMode && (
                  <FormField
                    control={form.control}
                    name="product_knowledge"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("product_knowledge")}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={t("select_product_knowledge")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {productKnowledgeOptions.map((pk) => (
                              <SelectItem key={pk.id} value={pk.id}>
                                {pk.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {t("product_knowledge_selection_description")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="batch.lot_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("lot_number")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("enter_lot_number")}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        {t("lot_number_description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiration_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("expiration_date")}</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={
                                !field.value ? "text-muted-foreground" : ""
                              }
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>{t("pick_a_date")}</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        {t("expiration_date_description")}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  navigate(`/facility/${facilityId}/settings/product`)
                }
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? t("saving")
                  : isEditMode
                    ? t("update")
                    : t("create")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </Page>
  );
}
