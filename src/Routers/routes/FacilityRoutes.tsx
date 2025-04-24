import { Redirect } from "raviger";

import FacilityUsers from "@/components/Facility/FacilityUsers";
import ResourceCreate from "@/components/Resource/ResourceForm";

import { AppRoutes } from "@/Routers/AppRouter";
import { FacilityOverview } from "@/pages/Facility/overview";
import FacilityServices from "@/pages/Facility/services/FacilityServices";
import HealthcareServiceShow from "@/pages/Facility/services/HealthcareServiceShow";
import ServiceRequestList from "@/pages/Facility/services/requests/ServiceRequestList";
import { SettingsLayout } from "@/pages/Facility/settings/layout";

const FacilityRoutes: AppRoutes = {
  "/facility": () => <Redirect to="/" />,
  "/facility/:facilityId/overview": ({ facilityId }) => (
    <FacilityOverview facilityId={facilityId} />
  ),
  "/facility/:facilityId/users": ({ facilityId }) => (
    <FacilityUsers facilityId={facilityId} />
  ),
  "/facility/:facilityId/resource/new": ({ facilityId }) => (
    <ResourceCreate facilityId={facilityId} />
  ),
  "/facility/:facilityId/settings*": ({ facilityId }) => (
    <SettingsLayout facilityId={facilityId} />
  ),
  "/facility/:facilityId/services": ({ facilityId }) => (
    <FacilityServices facilityId={facilityId} />
  ),
  "/facility/:facilityId/services/:serviceId": ({ facilityId, serviceId }) => (
    <HealthcareServiceShow facilityId={facilityId} serviceId={serviceId} />
  ),
  "/facility/:facilityId/services/:serviceId/requests/locations/:locationId": ({
    facilityId,
    serviceId,
    locationId,
  }) => (
    <ServiceRequestList
      facilityId={facilityId}
      serviceId={serviceId}
      locationId={locationId}
    />
  ),
};

export default FacilityRoutes;
