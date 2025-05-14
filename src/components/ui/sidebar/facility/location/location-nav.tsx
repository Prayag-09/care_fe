import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { NavMain } from "@/components/ui/sidebar/nav-main";

import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";

export function LocationNav() {
  const { t } = useTranslation();

  const { facility } = useCurrentFacility();
  const { location } = useCurrentLocation();

  const baseUrl = `/facility/${facility?.id}/locations/${location?.id}`;

  return (
    <NavMain
      links={[
        {
          name: t("general"),
          url: `${baseUrl}/general`,
          icon: <CareIcon icon="l-location-arrow-alt" />,
        },
        {
          name: t("laboratory"),
          url: `${baseUrl}/laboratory`,
          icon: <CareIcon icon="l-microscope" />,
        },
        {
          name: t("pharmacy"),
          url: `${baseUrl}/pharmacy`,
          icon: <CareIcon icon="l-medical-drip" />,
          children: [
            {
              name: t("pharmacy_sub_item_1"),
              url: `${baseUrl}/pharmacy_sub_item_1`,
            },
            {
              name: t("pharmacy_sub_item_2"),
              url: `${baseUrl}/pharmacy_sub_item_2`,
            },
            {
              name: t("pharmacy_sub_item_3"),
              url: `${baseUrl}/pharmacy_sub_item_3`,
            },
          ],
        },
        {
          name: t("inventory"),
          url: `${baseUrl}/inventory`,
          icon: <CareIcon icon="l-shop" />,
          children: [
            {
              name: t("supply_request"),
              url: `${baseUrl}/supply_requests`,
            },
            {
              name: t("supply_delivery"),
              url: `${baseUrl}/supply_deliveries`,
            },
          ],
        },
      ]}
    />
  );
}
