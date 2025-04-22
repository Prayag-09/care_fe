import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import query from "@/Utils/request/query";
import { DurationSpec } from "@/types/emr/specimenDefinition/specimenDefinition";
import specimenDefinitionApi from "@/types/emr/specimenDefinition/specimenDefinitionApi";
import { Code } from "@/types/questionnaire/code";

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
    queryKey: ["specimen_definition", facilityId, specimenDefinitionId],
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

  const formatQuantity = (
    quantity: { value: number | null; unit: Code | null } | null,
  ) => {
    if (!quantity?.value || !quantity?.unit?.display) return "-";
    return `${quantity.value} ${quantity.unit.display}`;
  };

  const formatDuration = (duration: DurationSpec | null | undefined) => {
    if (!duration) return "-";
    return formatQuantity(duration);
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/specimen_definitions"
          className="flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-500">
              {specimenDefinition.title}
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="text-destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              {t("delete")}
            </Button>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              {t("edit")}
            </Button>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-md font-semibold text-gray-400">
              {t("basic_information")}
            </p>
            <Badge
              variant={
                specimenDefinition.status === "active" ? "default" : "secondary"
              }
            >
              {specimenDefinition.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-400">{t("slug")}</p>
              <p>{specimenDefinition.slug}</p>
            </div>
            {specimenDefinition.derived_from_uri && (
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t("derived_from_uri")}
                </p>
                <p className="break-all">
                  {specimenDefinition.derived_from_uri}
                </p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-gray-400">
              {t("description")}
            </p>
            <p className="text-pretty">
              {specimenDefinition.description || "-"}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-gray-400">
            {t("specimen_details")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specimenDefinition.type_collected && (
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t("type_collected")}
                </p>
                <p className="font-medium">
                  {specimenDefinition.type_collected.display}
                </p>
              </div>
            )}

            {specimenDefinition.collection && (
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t("collection_method")}
                </p>
                <p className="font-medium">
                  {specimenDefinition.collection.display}
                </p>
              </div>
            )}
          </div>

          {specimenDefinition.patient_preparation &&
            specimenDefinition.patient_preparation.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t("patient_preparation")}
                </p>
                <div className="space-y-2">
                  {specimenDefinition.patient_preparation.map((prep, index) => (
                    <div key={index} className="flex items-start gap-1">
                      <span className="text-muted-foreground">•</span>
                      <div>
                        <p>{prep.display}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Type Tested Information */}
        {specimenDefinition.type_tested && (
          <div className="space-y-6">
            <p className="text-md font-semibold text-gray-400">
              {t("type_tested_information")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-400">
                  {t("is_derived")}
                </p>
                <Badge variant="outline">
                  {specimenDefinition.type_tested.is_derived
                    ? t("yes")
                    : t("no")}
                </Badge>
              </div>
              {specimenDefinition.type_tested.specimen_type && (
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    {t("specimen_type")}
                  </p>
                  <p className="font-medium">
                    {specimenDefinition.type_tested.specimen_type.display}
                  </p>
                </div>
              )}
            </div>

            {/* Container Information */}
            {specimenDefinition.type_tested.container && (
              <>
                <Separator className="my-6" />
                <div className="space-y-6">
                  <p className="text-lg font-medium text-gray-400">
                    {t("container_information")}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {specimenDefinition.type_tested.container.description && (
                      <div>
                        <p className="text-sm font-medium text-gray-400">
                          {t("description")}
                        </p>
                        <p>
                          {specimenDefinition.type_tested.container.description}
                        </p>
                      </div>
                    )}
                    {specimenDefinition.type_tested.container.preparation && (
                      <div>
                        <p className="text-sm font-medium text-gray-400">
                          {t("preparation")}
                        </p>
                        <p>
                          {specimenDefinition.type_tested.container.preparation}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {specimenDefinition.type_tested.container.capacity && (
                      <div>
                        <p className="text-sm font-medium text-gray-400">
                          {t("capacity")}
                        </p>
                        <p>
                          {formatQuantity(
                            specimenDefinition.type_tested.container.capacity,
                          )}
                        </p>
                      </div>
                    )}
                    {specimenDefinition.type_tested.container
                      .minimum_volume && (
                      <div>
                        <p className="text-sm font-medium text-gray-400">
                          {t("minimum_volume")}
                        </p>
                        <p>
                          {formatQuantity(
                            specimenDefinition.type_tested.container
                              .minimum_volume,
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {specimenDefinition.type_tested.container.cap && (
                    <div>
                      <p className="text-sm font-medium text-gray-400">
                        {t("cap")}
                      </p>
                      <p className="font-medium">
                        {specimenDefinition.type_tested.container.cap.display}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Additional Information */}
            <Separator className="my-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {specimenDefinition.type_tested.requirement && (
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    {t("requirement")}
                  </p>
                  <p>{specimenDefinition.type_tested.requirement}</p>
                </div>
              )}
              {specimenDefinition.type_tested.retention_time && (
                <div>
                  <p className="text-sm font-medium text-gray-400">
                    {t("retention_time")}
                  </p>
                  <p>
                    {formatDuration(
                      specimenDefinition.type_tested.retention_time,
                    )}
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-400">
                {t("single_use")}
              </p>
              <Badge variant="outline">
                {specimenDefinition.type_tested.single_use ? t("yes") : t("no")}
              </Badge>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
