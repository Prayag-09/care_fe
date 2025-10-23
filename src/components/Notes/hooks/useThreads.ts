import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import query from "@/Utils/request/query";
import patientApi from "@/types/emr/patient/patientApi";

import { THREAD_TEMPLATES } from "@/src/components/Notes/constants";

interface UseThreadsProps {
  patientId: string;
  encounterId?: string;
  hideEncounterNotes: boolean;
  canAccess: boolean;
}

export function useThreads({
  patientId,
  encounterId,
  hideEncounterNotes,
  canAccess,
}: UseThreadsProps) {
  const { data: threadsData, isLoading: threadsLoading } = useQuery({
    queryKey: ["threads", encounterId],
    queryFn: query(patientApi.listThreads, {
      pathParams: { patientId },
      queryParams: {
        ...(hideEncounterNotes
          ? { encounter_isnull: "true" }
          : encounterId && { encounter: encounterId }),
      },
    }),
    enabled: canAccess,
  });

  const unusedTemplates = useMemo(() => {
    if (!threadsData?.results.length) return [...THREAD_TEMPLATES];

    const threadTitles = threadsData.results.map((thread) => thread.title);
    return THREAD_TEMPLATES.filter(
      (template) => !threadTitles.includes(template),
    );
  }, [threadsData]);

  return {
    threadsData,
    threadsLoading,
    unusedTemplates,
  };
}
