import { useRoutes } from "raviger";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { GeneralSettings } from "@/pages/Facility/settings/general/general";

interface LocationLayoutProps {
  facilityId: string;
  locationId: string;
}

const getRoutes = (facilityId: string, locationId: string) => ({
  "/general": () => <GeneralSettings facilityId={facilityId} />,
  //   Todo remove the following route
  "/general_": () => <GeneralSettings facilityId={locationId} />,

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
