import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import query from "@/Utils/request/query";
import specimenDefinitionApi from "@/types/emr/specimenDefinition/specimenDefinitionApi";

interface SpecimenDefinitionDetailProps {
  facilityId: string;
  specimenDefinitionId: string;
}

export function SpecimenDefinitionDetail({
  facilityId,
  specimenDefinitionId,
}: SpecimenDefinitionDetailProps) {
  const { t } = useTranslation();

  const { data: specimenDefinition, isLoading } = useQuery({
    queryKey: ["specimen-definition", facilityId, specimenDefinitionId],
    queryFn: query(specimenDefinitionApi.retrieveSpecimenDefinition, {
      pathParams: { facilityId, specimenDefinitionId },
    }),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!specimenDefinition) {
    return <div>Specimen definition not found</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">{specimenDefinition.title}</h1>
        <div className="flex gap-2">
          <Link
            href={`/facility/${facilityId}/settings/specimen-definitions/${specimenDefinitionId}/edit`}
          >
            <Button variant="outline">{t("edit")}</Button>
          </Link>
          <Link href={`/facility/${facilityId}/settings/specimen-definitions`}>
            <Button variant="outline">{t("back")}</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium">{t("status")}</h3>
              <Badge
                variant={
                  specimenDefinition.status === "active"
                    ? "default"
                    : "secondary"
                }
              >
                {specimenDefinition.status}
              </Badge>
            </div>
            <div>
              <h3 className="font-medium">{t("description")}</h3>
              <p>{specimenDefinition.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
