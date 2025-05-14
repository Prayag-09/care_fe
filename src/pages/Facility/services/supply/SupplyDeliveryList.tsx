import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/definition-list/EmptyState";
import { FilterSelect } from "@/components/definition-list/FilterSelect";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  SupplyDeliveryRead,
  SupplyDeliveryStatus,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";

const STATUS_COLORS: Record<string, string> = {
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  abandoned: "bg-red-100 text-red-700",
  entered_in_error: "bg-red-100 text-red-700",
};

interface Props {
  facilityId: string;
  locationId: string;
}

export default function SupplyDeliveryList({ facilityId, locationId }: Props) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["supplyDeliveries", qParams],
    queryFn: query.debounced(supplyDeliveryApi.listSupplyDelivery, {
      queryParams: {
        facility: facilityId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        search: qParams.search,
        status: qParams.status,
        origin: locationId,
      },
    }),
  });

  const deliveries = response?.results || [];

  return (
    <Page title={t("supply_deliveries")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-xl font-semibold text-gray-900">
              {t("supply_deliveries")}
            </h1>
            <Button
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/locations/${locationId}/supply_deliveries/new`,
                )
              }
            >
              <CareIcon icon="l-plus" className="mr-2 size-4" />
              {t("create_supply_delivery")}
            </Button>
          </div>
        </div>

        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder={t("search_supply_deliveries")}
              value={qParams.search}
              onChange={(e) => updateQuery({ search: e.target.value })}
              className="w-full"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial sm:w-auto">
              <FilterSelect
                value={qParams.status || ""}
                onValueChange={(value) => updateQuery({ status: value })}
                options={Object.values(SupplyDeliveryStatus)}
                label="status"
                onClear={() => updateQuery({ status: undefined })}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton count={5} />
        ) : deliveries.length === 0 ? (
          <EmptyState
            title={t("no_supply_deliveries_found")}
            description={t("no_supply_deliveries_found_description")}
            icon="l-box"
          />
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("item")}</TableHead>
                    <TableHead>{t("quantity")}</TableHead>
                    <TableHead>{t("destination")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="w-[100px]">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery: SupplyDeliveryRead) => (
                    <TableRow key={delivery.id}>
                      <TableCell>
                        {delivery.supplied_item.product_knowledge.name}
                        {delivery.supplied_item.batch && (
                          <div className="text-xs text-gray-500 font-normal">
                            Lot #{delivery.supplied_item.batch.lot_number}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{delivery.supplied_item_quantity}</TableCell>
                      <TableCell>{delivery.destination.name}</TableCell>
                      <TableCell>
                        <Badge
                          className={STATUS_COLORS[delivery.status]}
                          variant="secondary"
                        >
                          {t(delivery.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/facility/${facilityId}/locations/${locationId}/supply_deliveries/${delivery.id}`,
                            )
                          }
                        >
                          <CareIcon icon="l-eye" className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4">
              <Pagination totalCount={response?.count || 0} />
            </div>
          </>
        )}
      </div>
    </Page>
  );
}
