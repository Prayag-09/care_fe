import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "raviger";
import { useTranslation } from "react-i18next";

import mutate from "@/Utils/request/mutate";
import specimenDefinitionApi from "@/types/emr/specimenDefinition/specimenDefinitionApi";

import { SpecimenDefinitionForm } from "./SpecimenDefinitionForm";

interface CreateSpecimenDefinitionProps {
  facilityId: string;
}

export function CreateSpecimenDefinition({
  facilityId,
}: CreateSpecimenDefinitionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: createSpecimenDefinition, isPending } = useMutation({
    mutationFn: mutate(specimenDefinitionApi.createSpecimenDefinition, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["specimen-definitions", facilityId],
      });
      navigate(`/facility/${facilityId}/settings/specimen-definitions`);
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">
        {t("create_specimen_definition")}
      </h1>
      <SpecimenDefinitionForm
        onSubmit={createSpecimenDefinition}
        isLoading={isPending}
      />
    </div>
  );
}
