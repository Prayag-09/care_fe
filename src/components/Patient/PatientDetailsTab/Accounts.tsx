import { AccountList } from "@/pages/Facility/billing/account/AccountList";

interface AccountsProps {
  patientId: string;
  facilityId?: string;
}

export const Accounts = (props: AccountsProps) => {
  return (
    <>
      {props.facilityId && (
        <AccountList
          facilityId={props.facilityId}
          patientId={props.patientId}
        />
      )}
    </>
  );
};
