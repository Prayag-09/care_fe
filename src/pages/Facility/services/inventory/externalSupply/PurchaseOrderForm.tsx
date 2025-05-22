import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import Page from "@/components/Common/Page";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import { SupplyRequestFormContent } from "@/pages/Facility/services/supply/SupplyRequestForm";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";

interface Props {
  facilityId: string;
  locationId: string;
  supplyRequestId?: string;
}

export function PurchaseOrderForm({
  facilityId,
  locationId,
  supplyRequestId,
}: Props) {
  const { t } = useTranslation();
  const isEditMode = Boolean(supplyRequestId);
  const title = isEditMode
    ? t("edit_purchase_order")
    : t("create_purchase_order");

  const { data: existingData, isFetching } = useQuery({
    queryKey: ["supplyRequest", supplyRequestId],
    queryFn: query(supplyRequestApi.retrieveSupplyRequest, {
      pathParams: { supplyRequestId: supplyRequestId! },
    }),
    enabled: isEditMode,
  });

  if (isEditMode && isFetching) {
    return (
      <Page title={title} hideTitleOnPage>
        <div className="container mx-auto max-w-3xl">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
          <FormSkeleton rows={10} />
        </div>
      </Page>
    );
  }

  return (
    <Page title={title} hideTitleOnPage>
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        </div>
        <SupplyRequestFormContent
          facilityId={facilityId}
          locationId={locationId}
          supplyRequestId={supplyRequestId}
          existingData={existingData}
          type="external"
          onSuccess={() => {
            toast.success(
              isEditMode
                ? t("purchase_order_updated")
                : t("purchase_orders_created"),
            );
            navigate(
              `/facility/${facilityId}/locations/${locationId}/external_supply/purchase_orders`,
            );
          }}
        />
      </div>
    </Page>
  );
}
