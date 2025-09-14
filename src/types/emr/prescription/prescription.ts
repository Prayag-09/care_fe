import { UserReadMinimal } from "@/types/user/user";
export interface Prescription {
  id: string;
  name?: string;
  note?: string;
  status: PrescriptionStatus;
}

export enum PrescriptionStatus {
  // Prescription awaiting dispense
  active = "active",
  // The order moved to dispense state
  completed = "completed",
  // The order was cancelled
  cancelled = "cancelled",
}

export interface PrescriptionCreate extends Omit<Prescription, "id"> {
  alternate_identifier: string;
}

export interface PrescriptionRead extends Prescription {
  prescribed_by: UserReadMinimal;
}
