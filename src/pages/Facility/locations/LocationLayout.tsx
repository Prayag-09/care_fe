import { useRoutes } from "raviger";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import MedicationRequestList from "@/pages/Facility/services/pharmacy/MedicationRequestList";
import SupplyDeliveryForm from "@/pages/Facility/services/supply/SupplyDeliveryForm";
import SupplyDeliveryList from "@/pages/Facility/services/supply/SupplyDeliveryList";
import SupplyDeliveryView from "@/pages/Facility/services/supply/SupplyDeliveryView";
import SupplyRequestForm from "@/pages/Facility/services/supply/SupplyRequestForm";
import SupplyRequestList from "@/pages/Facility/services/supply/SupplyRequestList";
import SupplyRequestView from "@/pages/Facility/services/supply/SupplyRequestView";

interface LocationLayoutProps {
  facilityId: string;
  locationId: string;
}

const getRoutes = (facilityId: string, locationId: string) => ({
  "/medication_requests": () => (
    <MedicationRequestList facilityId={facilityId} />
  ),
  "/supply_requests": () => (
    <SupplyRequestList facilityId={facilityId} locationId={locationId} />
  ),
  "/supply_requests/new": () => (
    <SupplyRequestForm facilityId={facilityId} locationId={locationId} />
  ),
  "/supply_requests/:id": ({ id }: { id: string }) => (
    <SupplyRequestView
      facilityId={facilityId}
      locationId={locationId}
      supplyRequestId={id}
    />
  ),
  "/supply_requests/:id/edit": ({ id }: { id: string }) => (
    <SupplyRequestForm
      facilityId={facilityId}
      locationId={locationId}
      supplyRequestId={id}
    />
  ),

  // Supply Delivery Routes
  "/supply_deliveries": () => (
    <SupplyDeliveryList facilityId={facilityId} locationId={locationId} />
  ),
  "/supply_deliveries/new": () => (
    <SupplyDeliveryForm facilityId={facilityId} locationId={locationId} />
  ),
  "/supply_deliveries/:id": ({ id }: { id: string }) => (
    <SupplyDeliveryView
      facilityId={facilityId}
      locationId={locationId}
      supplyDeliveryId={id}
    />
  ),
  "/supply_deliveries/:id/edit": ({ id }: { id: string }) => (
    <SupplyDeliveryForm
      facilityId={facilityId}
      locationId={locationId}
      supplyDeliveryId={id}
    />
  ),

  "*": () => <ErrorPage />,
});

export function LocationLayout({
  facilityId,
  locationId,
}: LocationLayoutProps) {
  const basePath = `/facility/${facilityId}/locations/${locationId}`;
  const routeResult = useRoutes(getRoutes(facilityId, locationId), {
    basePath,
    routeProps: {
      facilityId,
      locationId,
    },
  });

  return <div className="container mx-auto p-4">{routeResult}</div>;
}
