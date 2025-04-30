import { useMutation, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import mutate from "@/Utils/request/mutate";
import specimenDefinitionApi from "@/types/emr/specimenDefinition/specimenDefinitionApi";

import { SpecimenDefinitionForm } from "./SpecimenDefinitionForm";

interface CreateSpecimenDefinitionProps {
  facilityId: string;
  onSuccess?: () => void;
}

export function CreateSpecimenDefinition({
  facilityId,
  onSuccess = () => navigate(`/settings/specimen_definitions`),
}: CreateSpecimenDefinitionProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { mutate: createSpecimenDefinition, isPending } = useMutation({
    mutationFn: mutate(specimenDefinitionApi.createSpecimenDefinition, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      toast.success(t("specimen_definition_created"));
      queryClient.invalidateQueries({
        queryKey: ["specimen_definitions", facilityId],
      });
      onSuccess?.();
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
