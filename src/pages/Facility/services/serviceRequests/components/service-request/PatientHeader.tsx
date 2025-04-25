import { t } from "i18next";
import { Link } from "raviger";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Patient } from "@/types/emr/newPatient";

interface PatientHeaderProps {
  patient: Patient;
  facilityId: string;
}

export function PatientHeader({ patient, facilityId }: PatientHeaderProps) {
  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/facility/${facilityId}/patient/${patient.id}`}
              className="text-lg font-medium hover:underline"
            >
              {patient.name}
            </Link>
            <CareIcon
              icon="l-external-link-alt"
              className="size-4 opacity-50"
            />
          </div>
          <div className="text-sm text-gray-600">UHID: {patient.id}</div>
        </div>

        <div className="text-sm text-gray-600">
          {patient.date_of_birth &&
            new Date(patient.date_of_birth).toLocaleDateString()}
          /{t(patient.gender)}
        </div>
      </div>
    </div>
  );
}
