import { MapPinIcon } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";

export function LocationSwitcher() {
  const { t } = useTranslation();
  const { facilityId } = useCurrentLocation();
  const { location } = useCurrentLocation();

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="ghost"
        onClick={() => navigate(`/facility/${facilityId}`)}
        className="gap-2"
      >
        <CareIcon icon="l-arrow-left" />
        <span className="underline underline-offset-2">{t("back")}</span>
      </Button>
      <div className="pl-2 flex items-center gap-2">
        <MapPinIcon className="size-4" />
        <span className="text-sm font-medium">{location?.name}</span>
      </div>
    </div>
  );
}
