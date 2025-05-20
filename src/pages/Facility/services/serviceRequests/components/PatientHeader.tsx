import { t } from "i18next";
import { navigate } from "raviger";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { formatPatientAge } from "@/Utils/utils";
import { Patient } from "@/types/emr/patient/patient";

interface PatientHeaderProps {
  patient: Patient;
  facilityId: string;
}

export function PatientHeader({ patient, facilityId }: PatientHeaderProps) {
  return (
    <div>
      <div className="flex items-center gap-20 justify-between">
        <div className="text-sm flex flex-col">
          <div className="text-gray-600">Patient</div>
          <div className="text-gray-950 font-semibold underline underline-offset-2 flex items-center gap-1">
            <div
              className="text-lg font-medium hover:underline cursor-pointer"
              onClick={() => {
                navigate(`/facility/${facilityId}/patient/${patient.id}`);
              }}
            >
              {patient.name}
            </div>
            <CareIcon
              icon="l-external-link-alt"
              className="size-4 opacity-50"
            />
          </div>
        </div>
        <div className="text-sm flex flex-col">
          <div className="text-gray-600">UHID: </div>
          <div className="text-gray-950 font-semibold">{patient.id}</div>
        </div>
        <div className="text-sm flex flex-col">
          <div className="text-gray-600">Age/Sex </div>
          <div className="text-gray-950 font-semibold">
            {formatPatientAge(patient, true)}/{t(patient.gender)}
          </div>
        </div>
      </div>
    </div>
  );
}
