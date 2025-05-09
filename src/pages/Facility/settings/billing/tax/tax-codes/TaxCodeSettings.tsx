import { useTranslation } from "react-i18next";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Loading from "@/components/Common/Loading";

import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { Code } from "@/types/questionnaire/code";

export function TaxCodeSettings() {
  const { t } = useTranslation();
  const facility = useCurrentFacility();

  if (!facility) {
    return <Loading />;
  }

  const allCodes = facility.instance_tax_codes || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tax_codes")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("code")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allCodes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center text-muted-foreground h-24"
                >
                  {t("no_tax_codes")}
                </TableCell>
              </TableRow>
            ) : (
              allCodes.map((code: Code) => (
                <TableRow key={code.code}>
                  <TableCell>{code.display}</TableCell>
                  <TableCell>
                    <code className="px-2 py-1 rounded bg-gray-100 text-sm">
                      {code.code}
                    </code>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
