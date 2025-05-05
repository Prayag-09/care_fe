import { EncounterTabProps } from "@/pages/Encounters/EncounterShow";
import { AccountList } from "@/pages/Facility/billing/account/AccountList";

export default function EncounterAccountsTab(props: EncounterTabProps) {
  const { patient, encounter } = props;
  return (
    <div>
      <AccountList
        patientId={patient.id}
        facilityId={encounter.facility.id}
        hideTitleOnPage
      />
    </div>
  );
}
