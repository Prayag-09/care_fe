import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import query from "@/Utils/request/query";
import specimenDefinitionApi from "@/types/emr/specimenDefinition/specimenDefinitionApi";

interface SpecimenDefinitionsListProps {
  facilityId: string;
}

export function SpecimenDefinitionsList({
  facilityId,
}: SpecimenDefinitionsListProps) {
  const { t } = useTranslation();

  const { data: specimenDefinitions, isLoading } = useQuery({
    queryKey: ["specimen_definitions", facilityId],
    queryFn: query(specimenDefinitionApi.listSpecimenDefinitions, {
      pathParams: { facilityId },
    }),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">{t("specimen_definitions")}</h1>
        <Link href={`/specimen_definitions/create`}>
          <Button>{t("create_specimen_definition")}</Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("title")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("description")}</TableHead>
              <TableHead>{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {specimenDefinitions?.results.map((definition) => (
              <TableRow key={definition.id}>
                <TableCell>{definition.title}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      definition.status === "active" ? "default" : "secondary"
                    }
                  >
                    {definition.status}
                  </Badge>
                </TableCell>
                <TableCell>{definition.description}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Link href={`/specimen_definitions/${definition.id}`}>
                      <Button variant="outline" size="sm">
                        {t("view")}
                      </Button>
                    </Link>
                    <Link href={`/specimen_definitions/${definition.id}/edit`}>
                      <Button variant="outline" size="sm">
                        {t("edit")}
                      </Button>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
