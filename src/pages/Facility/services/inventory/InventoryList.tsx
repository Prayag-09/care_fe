import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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

import query from "@/Utils/request/query";
import {
  InventoryStatus,
  InventoryStatusOptions,
} from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";

interface InventoryListProps {
  facilityId: string;
  locationId: string;
}

export function InventoryList({ facilityId, locationId }: InventoryListProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<InventoryStatus>();

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", facilityId, locationId, { status }],
    queryFn: query(inventoryApi.list, {
      pathParams: { facilityId, locationId },
      queryParams: { status },
    }),
  });

  return (
    <Page
      title={t("inventory")}
      options={
        <Select
          value={status}
          onValueChange={(value: InventoryStatus | "all") =>
            setStatus(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="max-w-40">
            <div className="flex items-center gap-2">
              <CareIcon icon="l-filter" className="size-4" />
              <SelectValue placeholder={t("status")} />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all_statuses")}</SelectItem>
            {InventoryStatusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {t(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      }
    >
      <Separator className="my-4" />

      {isLoading ? (
        <div className="rounded-md border">
          <TableSkeleton count={10} />
        </div>
      ) : !data?.results?.length ? (
        <EmptyState />
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead>{t("product")}</TableHead>
                <TableHead>{t("net_content")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("expiration_date")}</TableHead>
                <TableHead>{t("batch")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {data?.results?.map((inventory) => (
                <TableRow key={inventory.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <Link
                      href={`/facility/${facilityId}/settings/product_knowledge/${inventory.product.product_knowledge.id}`}
                      basePath="/"
                      className="flex items-center gap-2"
                    >
                      {inventory.product.product_knowledge.name}
                      <CareIcon
                        icon="l-external-link-alt"
                        className="size-4 text-gray-500"
                      />
                    </Link>
                  </TableCell>
                  <TableCell>{inventory.net_content}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "capitalize",
                        {
                          active: "bg-green-100 text-green-800",
                          inactive: "bg-gray-100 text-gray-800",
                          entered_in_error: "bg-red-100 text-red-800",
                        }[inventory.status],
                      )}
                    >
                      {t(inventory.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {inventory.product.expiration_date
                      ? new Date(
                          inventory.product.expiration_date,
                        ).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {inventory.product.batch?.lot_number || "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Page>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <h3 className="mt-2 text-sm font-semibold text-gray-900">
        {t("no_inventory")}
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        {t("no_inventory_description")}
      </p>
    </div>
  );
}
