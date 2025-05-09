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
import { MonetaryComponentRead } from "@/types/base/monetaryComponent/monetaryComponent";

function MonetaryDisplay({ factor, amount }: MonetaryComponentRead) {
  if (factor != null) {
    return <span>{factor}%</span>;
  }
  if (amount != null) {
    return <span>₹{amount}</span>;
  }
  return null;
}

export function TaxComponentSettings() {
  const { t } = useTranslation();
  const facility = useCurrentFacility();

  if (!facility) {
    return <Loading />;
  }

  const allComponents = facility.instance_tax_monetary_components || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tax_components")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead>{t("code")}</TableHead>
              <TableHead>{t("value")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allComponents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center text-muted-foreground h-24"
                >
                  {t("no_tax_components")}
                </TableCell>
              </TableRow>
            ) : (
              allComponents.map((component) => (
                <TableRow key={`${component.code?.code || component.title}`}>
                  <TableCell>{component.title}</TableCell>
                  <TableCell>
                    {component.code && (
                      <code className="px-2 py-1 rounded bg-gray-100 text-sm">
                        {component.code.code}
                      </code>
                    )}
                  </TableCell>
                  <TableCell>
                    <MonetaryDisplay {...component} />
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
