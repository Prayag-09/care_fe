export const MESSAGES_LIMIT = 20;

export const THREAD_TEMPLATES = [
  "Treatment Plan",
  "Medication Notes",
  "Care Coordination",
  "General Notes",
  "Patient History",
  "Referral Notes",
  "Lab Results Discussion",
] as const;

export type ThreadTemplate = (typeof THREAD_TEMPLATES)[number];
