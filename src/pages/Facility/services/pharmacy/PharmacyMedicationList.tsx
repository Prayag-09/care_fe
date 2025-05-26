import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import { PatientHeader } from "@/pages/Facility/services/serviceRequests/components/PatientHeader";

import DispensedMedicationList from "./DispensedMedicationList";
import MedicationDispenseList from "./MedicationDispenseList";

export enum PharmacyMedicationTab {
  PRESCRIPTIONS = "prescriptions",
  DISPENSE = "dispense",
}
interface Props {
  facilityId: string;
  patientId: string;
  tab?: PharmacyMedicationTab;
}

export default function PharmacyMedicationList({
  facilityId,
  patientId,
  tab,
}: Props) {
  const { t } = useTranslation();
  const { locationId } = useCurrentLocation();

  const { data: patientData } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(routes.patient.getPatient, {
      pathParams: { id: patientId ?? "" },
    }),
    enabled: !!patientId,
  });

  return (
    <Page title={t("pharmacy_medications")} hideTitleOnPage>
      <div>
        <Button
          variant="outline"
          className="text-gray-950 font-semibold border-gray-300 mb-4"
          onClick={() =>
            navigate(
              `/facility/${facilityId}/locations/${locationId}/medication_requests/`,
            )
          }
        >
          <ArrowLeftIcon className="size-4" />
          Back to Prescription Queue
        </Button>
      </div>
      {patientData && (
        <Card className="mb-4 p-4 rounded-none shadow-none bg-gray-100">
          <PatientHeader patient={patientData} facilityId={facilityId} />
        </Card>
      )}
      <Tabs
        value={tab}
        onValueChange={(value) =>
          navigate(
            `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${patientId}/${value}`,
          )
        }
      >
        <TabsList className="flex">
          <TabsTrigger value="prescriptions" id="user-card-view">
            <CareIcon icon="l-credit-card" className="text-lg" />
            <span>{t("prescriptions")}</span>
          </TabsTrigger>
          <TabsTrigger value="dispense" id="user-list-view">
            <CareIcon icon="l-list-ul" className="text-lg" />
            <span>{t("dispense")}</span>
          </TabsTrigger>
        </TabsList>

        <div>
          <TabsContent value="prescriptions" className="p-2">
            <MedicationDispenseList
              facilityId={facilityId}
              patientId={patientId}
            />
          </TabsContent>
          <TabsContent value="dispense" className="p-2">
            <DispensedMedicationList
              facilityId={facilityId}
              patientId={patientId}
            />
          </TabsContent>
        </div>
      </Tabs>
    </Page>
  );
}
