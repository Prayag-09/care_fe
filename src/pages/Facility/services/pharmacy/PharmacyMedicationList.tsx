import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
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

interface Props {
  facilityId: string;
  patientId: string;
}

export default function PharmacyMedicationList({
  facilityId,
  patientId,
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

  const [activeTab, setActiveTab] = useState<
    "prescriptions" | "to_be_dispensed"
  >("prescriptions");

  useEffect(() => {
    console.log(activeTab);
  }, [activeTab]);

  return (
    <Page title={t("pharmacy_medications")} hideTitleOnPage>
      <div className="container mx-auto">
        <Button
          variant="link"
          className="underline underline-offset-2 text-gray-950 font-semibold pl-0 cursor-pointer"
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
        <Card className="mb-4 p-4 rounded-md shadow-none">
          <PatientHeader
            patient={patientData}
            facilityId={facilityId}
            link={``}
          />
        </Card>
      )}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "prescriptions" | "to_be_dispensed")
        }
      >
        <TabsList className="flex">
          <TabsTrigger value="prescriptions" id="user-card-view">
            <CareIcon icon="l-credit-card" className="text-lg" />
            <span>{t("prescriptions")}</span>
          </TabsTrigger>
          <TabsTrigger value="to_be_dispensed" id="user-list-view">
            <CareIcon icon="l-list-ul" className="text-lg" />
            <span>{t("to_be_dispensed")}</span>
          </TabsTrigger>
        </TabsList>

        <div>
          <TabsContent value="prescriptions" className="p-2">
            <MedicationDispenseList
              facilityId={facilityId}
              patientId={patientId}
            />
          </TabsContent>
          <TabsContent value="to_be_dispensed" className="p-2">
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
