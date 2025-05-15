import { useQuery } from "@tanstack/react-query";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import inventoryApi from "@/types/inventory/product/inventoryApi";

interface InventoryListProps {
  facilityId: string;
  locationId: string;
}

export function InventoryList({ facilityId, locationId }: InventoryListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["inventory", facilityId, locationId],
    queryFn: query(inventoryApi.list, {
      pathParams: { facilityId, locationId },
    }),
  });

  if (isLoading) {
    return <TableSkeleton count={10} />;
  }

  if (data?.count === 0) {
    return <EmptyState />;
  }

  return "Todo";
}

function EmptyState() {
  return <div>No inventory found</div>;
}
