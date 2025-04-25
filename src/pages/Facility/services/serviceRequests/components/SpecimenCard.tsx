"use client";

import { format } from "date-fns";
import { t } from "i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import type { SpecimenRead } from "@/types/emr/specimen/specimen";
import { SpecimenStatus } from "@/types/emr/specimen/specimen";

interface SpecimenCardProps {
  specimen: SpecimenRead;
}

export function SpecimenCard({ specimen }: SpecimenCardProps) {
  const getStatusColor = (status: SpecimenStatus) => {
    switch (status) {
      case SpecimenStatus.available:
        return "bg-green-100 text-green-800";
      case SpecimenStatus.unavailable:
        return "bg-red-100 text-red-800";
      case SpecimenStatus.unsatisfactory:
        return "bg-yellow-100 text-yellow-800";
      case SpecimenStatus.entered_in_error:
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="bg-green-50 border-green-300">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-sm font-medium">
            {specimen.specimen_type?.display}
          </CardTitle>
          <Badge className={getStatusColor(specimen.status)}>
            {t(specimen.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="space-y-3">
          {/* Specimen Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>{" "}
              <span>{specimen.specimen_type?.display}</span>
            </div>
            {specimen.type_tested?.container && (
              <div>
                <span className="text-muted-foreground">Container:</span>{" "}
                <span>{specimen.type_tested.container.description}</span>
              </div>
            )}
            {specimen.type_tested?.container?.minimum_volume && (
              <div>
                <span className="text-muted-foreground">Minimum Volume:</span>{" "}
                <span>
                  {specimen.type_tested.container.minimum_volume.quantity
                    ? `${specimen.type_tested.container.minimum_volume.quantity.value} ${specimen.type_tested.container.minimum_volume.quantity.unit.display}`
                    : specimen.type_tested.container.minimum_volume.string}
                </span>
              </div>
            )}
            {specimen.type_tested?.container?.cap && (
              <div>
                <span className="text-muted-foreground">Cap:</span>{" "}
                <span>{specimen.type_tested.container.cap.display}</span>
              </div>
            )}
          </div>

          {/* Collection Details */}
          {specimen.collection && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Collection Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {specimen.collection.collected_date_time && (
                    <div>
                      <span className="text-muted-foreground">Collected:</span>{" "}
                      <span>
                        {format(
                          new Date(specimen.collection.collected_date_time),
                          "PPp",
                        )}
                      </span>
                    </div>
                  )}
                  {specimen.collection.collector && (
                    <div>
                      <span className="text-muted-foreground">Collector:</span>{" "}
                      <span>{specimen.collection.collector}</span>
                    </div>
                  )}
                  {specimen.collection.method && (
                    <div>
                      <span className="text-muted-foreground">Method:</span>{" "}
                      <span>{specimen.collection.method.display}</span>
                    </div>
                  )}
                  {specimen.collection.body_site && (
                    <div>
                      <span className="text-muted-foreground">Body Site:</span>{" "}
                      <span>{specimen.collection.body_site.display}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Processing Details */}
          {specimen.processing.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Processing</h4>
                {specimen.processing.map((process, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm"
                  >
                    <div>
                      <span className="text-muted-foreground">
                        Description:
                      </span>{" "}
                      <span>{process.description}</span>
                    </div>
                    {process.time_date_time && (
                      <div>
                        <span className="text-muted-foreground">Time:</span>{" "}
                        <span>
                          {format(new Date(process.time_date_time), "PPp")}
                        </span>
                      </div>
                    )}
                    {process.performer && (
                      <div>
                        <span className="text-muted-foreground">
                          Performer:
                        </span>{" "}
                        <span>{process.performer}</span>
                      </div>
                    )}
                    {process.method && (
                      <div>
                        <span className="text-muted-foreground">Method:</span>{" "}
                        <span>{process.method.display}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
