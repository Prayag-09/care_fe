import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import {
  SUPPLY_REQUEST_PRIORITY_COLORS,
  SUPPLY_REQUEST_STATUS_COLORS,
  SupplyRequestRead,
} from "@/types/inventory/supplyRequest/supplyRequest";

interface Props {
  requests: SupplyRequestRead[];
  isLoading: boolean;
  facilityId: string;
  locationId: string;
  baseUrl?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function SupplyRequestTable({
  requests,
  isLoading,
  facilityId,
  locationId,
  baseUrl = "supply_requests",
  emptyTitle,
  emptyDescription,
}: Props) {
  const { t } = useTranslation();

  if (isLoading) {
    return <TableSkeleton count={5} />;
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        title={emptyTitle || t("no_supply_requests_found")}
        description={
          emptyDescription || t("no_supply_requests_found_description")
        }
        icon="l-box"
      />
    );
  }

  return (
    <div className="rounded-md overflow-hidden border-2 border-white shadow-md">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow className="divide-x">
            <TableHead className="text-gray-700">{t("item")}</TableHead>
            <TableHead className="text-gray-700">{t("quantity")}</TableHead>
            <TableHead className="text-gray-700">{t("deliver_from")}</TableHead>
            <TableHead className="text-gray-700">{t("deliver_to")}</TableHead>
            <TableHead className="text-gray-700">{t("status")}</TableHead>
            <TableHead className="text-gray-700">{t("priority")}</TableHead>
            <TableHead className="w-[100px] text-gray-700">
              {t("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="bg-white">
          {requests.map((request: SupplyRequestRead) => (
            <TableRow key={request.id} className="divide-x">
              <TableCell className="font-semibold text-gray-950">
                {request.item.name}
              </TableCell>
              <TableCell className="font-medium text-gray-950">
                {request.quantity}
              </TableCell>
              <TableCell className="font-medium text-gray-950">
                {request.deliver_from?.name || t("not_specified")}
              </TableCell>
              <TableCell className="font-medium text-gray-950">
                {request.deliver_to.name}
              </TableCell>
              <TableCell>
                <Badge variant={SUPPLY_REQUEST_STATUS_COLORS[request.status]}>
                  {t(request.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={SUPPLY_REQUEST_PRIORITY_COLORS[request.priority]}
                >
                  {t(request.priority)}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-semibold text-gray-950"
                  onClick={() =>
                    navigate(
                      `/facility/${facilityId}/locations/${locationId}/${baseUrl}/${request.id}`,
                    )
                  }
                >
                  <CareIcon icon="l-eye" className="size-4" />
                  {t("view_details")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
