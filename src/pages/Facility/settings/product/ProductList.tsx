import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import { EmptyState } from "@/components/definition-list/EmptyState";
import { FilterSelect } from "@/components/definition-list/FilterSelect";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import ProductApi from "@/types/inventory/product/ProductApi";
import {
  ProductBase,
  ProductRead,
  ProductStatusOptions,
} from "@/types/inventory/product/product";

const PRODUCT_STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  inactive: "bg-gray-100 text-gray-700",
  entered_in_error: "bg-red-100 text-red-700",
};

function ProductCard({
  product,
  facilityId,
}: {
  product: ProductBase;
  facilityId: string;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  PRODUCT_STATUS_COLORS[product.status] ||
                  "bg-gray-100 text-gray-700"
                }
              >
                {t(product.status)}
              </Badge>
            </div>
            <h3 className="font-medium text-gray-900">
              Product ID: {product.id}
            </h3>
            {product.batch?.lot_number && (
              <p className="mt-1 text-sm text-gray-500">
                {t("lot_number")}: {product.batch.lot_number}
              </p>
            )}
            {product.expiration_date && (
              <p className="mt-1 text-xs text-gray-400">
                {t("expires")}:{" "}
                {format(new Date(product.expiration_date), "PPP")}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(`/facility/${facilityId}/settings/product/${product.id}`)
            }
          >
            <CareIcon icon="l-edit" className="size-4" />
            {t("see_details")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductList({ facilityId }: { facilityId: string }) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["products", qParams],
    queryFn: query.debounced(ProductApi.listProduct, {
      pathParams: {
        facilityId,
      },
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: qParams.status,
      },
    }),
  });

  const products = response?.results || [];

  return (
    <Page title={t("products")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-700">{t("products")}</h1>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{t("manage_products")}</p>
            </div>
            <Button
              onClick={() =>
                navigate(`/facility/${facilityId}/settings/product/new`)
              }
            >
              <CareIcon icon="l-plus" className="mr-2" />
              {t("add_product")}
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <div className="w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <CareIcon icon="l-search" className="size-5" />
                </span>
                <Input
                  placeholder={t("search_products")}
                  value={qParams.search || ""}
                  onChange={(e) =>
                    updateQuery({ search: e.target.value || undefined })
                  }
                  className="w-full md:w-[300px] pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.status || ""}
                  onValueChange={(value) => updateQuery({ status: value })}
                  options={Object.values(ProductStatusOptions)}
                  label="status"
                  onClear={() => updateQuery({ status: undefined })}
                />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:hidden">
              <CardGridSkeleton count={4} />
            </div>
            <div className="phidden md:block">
              <TableSkeleton count={5} />
            </div>
          </>
        ) : products.length === 0 ? (
          <EmptyState
            icon="l-folder-open"
            title={t("no_products_found")}
            description={t("adjust_product_filters")}
          />
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
              {products.map((product: ProductBase) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  facilityId={facilityId}
                />
              ))}
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead>{t("id")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("lot_number")}</TableHead>
                      <TableHead>{t("expires")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {products.map((product: ProductRead) => (
                      <TableRow key={product.id} className="divide-x">
                        <TableCell className="font-medium">
                          {product.product_knowledge.name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              PRODUCT_STATUS_COLORS[product.status] ||
                              "bg-gray-100 text-gray-700"
                            }
                          >
                            {t(product.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {product.batch?.lot_number || "-"}
                        </TableCell>
                        <TableCell>
                          {product.expiration_date
                            ? format(new Date(product.expiration_date), "PPP")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/facility/${facilityId}/settings/product/${product.id}`,
                              )
                            }
                          >
                            <CareIcon icon="l-edit" className="size-4" />
                            {t("see_details")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        {response && response.count > resultsPerPage && (
          <div className="mt-4 flex justify-center">
            <Pagination totalCount={response.count} />
          </div>
        )}
      </div>
    </Page>
  );
}
