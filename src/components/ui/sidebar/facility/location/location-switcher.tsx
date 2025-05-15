import { MapPinIcon } from "lucide-react";
import { navigate } from "raviger";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";

import useAppHistory from "@/hooks/useAppHistory";

import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";

export function LocationSwitcher() {
  const { t } = useTranslation();
  const { facilityId } = useCurrentLocation();
  const { location } = useCurrentLocation();
  const { state } = useSidebar();
  const { history } = useAppHistory();

  // Voluntarily using useMemo to extract the last url before entering location layout on first render!
  // We do not want to re-evaluate this on every render as it might yield a different result when navigating within the location layout.
  const backUrl = useMemo(
    () => (history.length > 1 ? history[1] : `/facility/${facilityId}/general`),
    //  eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (state === "collapsed") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate(backUrl)}
        className="w-8 h-8"
      >
        <CareIcon icon="l-arrow-left" />
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-4">
      <Button variant="ghost" onClick={() => navigate(backUrl)}>
        <CareIcon icon="l-arrow-left" />
        <span className="underline underline-offset-2">{t("back")}</span>
      </Button>

      <div className="w-full px-2">
        <div className="flex items-center gap-3 p-2 rounded-md bg-white border border-gray-200">
          <MapPinIcon className="size-5 text-green-600" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {location?.name}
            </span>
            <span className="text-xs text-gray-500">
              {t("current_location")}
            </span>
          </div>
        </div>
        <Separator className="mt-4" />
      </div>
    </div>
  );
}
