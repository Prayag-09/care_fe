import { useRoutes } from "raviger";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import CreateDevice from "@/pages/Facility/settings/devices/CreateDevice";
import DeviceDetail from "@/pages/Facility/settings/devices/DeviceShow";
import DevicesList from "@/pages/Facility/settings/devices/DevicesList";
import UpdateDevice from "@/pages/Facility/settings/devices/UpdateDevice";

import { GeneralSettings } from "./general/general";
import LocationSettings from "./locations/LocationSettings";
import ObservationDefinitionForm from "./observationDefinition/ObservationDefinitionForm";
import ObservationDefinitionList from "./observationDefinition/ObservationDefinitionList";
import FacilityOrganizationList from "./organizations/FacilityOrganizationList";
import { CreateSpecimenDefinition } from "./specimen-definitions/CreateSpecimenDefinition";
import { SpecimenDefinitionDetail } from "./specimen-definitions/SpecimenDefinitionDetail";
import { SpecimenDefinitionsList } from "./specimen-definitions/SpecimenDefinitionsList";
import { UpdateSpecimenDefinition } from "./specimen-definitions/UpdateSpecimenDefinition";

interface SettingsLayoutProps {
  facilityId: string;
}

const getRoutes = (facilityId: string) => ({
  "/general": () => <GeneralSettings facilityId={facilityId} />,
  "/departments": () => <FacilityOrganizationList facilityId={facilityId} />,
  "/departments/:id/:tab": ({ id, tab }: { id: string; tab: string }) => (
    <FacilityOrganizationList
      facilityId={facilityId}
      organizationId={id}
      currentTab={tab}
    />
  ),
  "/locations": () => <LocationSettings facilityId={facilityId} />,
  "/location/:id": ({ id }: { id: string }) => (
    <LocationSettings facilityId={facilityId} locationId={id} />
  ),
  "/devices": () => <DevicesList facilityId={facilityId} />,
  "/devices/create": () => <CreateDevice facilityId={facilityId} />,
  "/devices/:id": ({ id }: { id: string }) => (
    <DeviceDetail facilityId={facilityId} deviceId={id} />
  ),
  "/devices/:id/edit": ({ id }: { id: string }) => (
    <UpdateDevice facilityId={facilityId} deviceId={id} />
  ),
  "/specimen_definitions": () => (
    <SpecimenDefinitionsList facilityId={facilityId} />
  ),
  "/specimen_definitions/create": () => (
    <CreateSpecimenDefinition facilityId={facilityId} />
  ),
  "/specimen_definitions/:id": ({ id }: { id: string }) => (
    <SpecimenDefinitionDetail
      facilityId={facilityId}
      specimenDefinitionId={id}
    />
  ),
  "/specimen_definitions/:id/edit": ({ id }: { id: string }) => (
    <UpdateSpecimenDefinition
      facilityId={facilityId}
      specimenDefinitionId={id}
    />
  ),
  "/observation_definitions": () => (
    <ObservationDefinitionList facilityId={facilityId} />
  ),
  "/observation_definitions/new": () => (
    <ObservationDefinitionForm facilityId={facilityId} />
  ),
  "*": () => <ErrorPage />,
});

export function SettingsLayout({ facilityId }: SettingsLayoutProps) {
  const basePath = `/facility/${facilityId}/settings`;
  const routeResult = useRoutes(getRoutes(facilityId), {
    basePath,
    routeProps: {
      facilityId,
    },
  });

  return <div className="container mx-auto p-4">{routeResult}</div>;
}
