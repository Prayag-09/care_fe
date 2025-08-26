import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { NavMain } from "@/components/ui/sidebar/nav-main";

import useCurrentService from "@/pages/Facility/services/utils/useCurrentService";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";

export function ServiceNav() {
  const { t } = useTranslation();

  const { facility } = useCurrentFacility();
  const { service } = useCurrentService();

  const baseUrl = `/facility/${facility?.id}/services/${service?.id}`;

  return (
    <NavMain
      links={[
        {
          name: t("locations"),
          url: `${baseUrl}/`,
          icon: <CareIcon icon="l-map-pin" />,
        },
        {
          name: t("queues"),
          url: `${baseUrl}/queues`,
          icon: <CareIcon icon="l-calender" />,
        },
      ]}
    />
  );
}
