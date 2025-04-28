import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import { InvoiceRead } from "@/types/billing/invoice/invoice";

export interface InvoicesTableProps {
  isLoading: boolean;
  items?: InvoiceRead[];
  onCreateClick: () => void;
  facilityId: string;
}

export function InvoicesTable({
  isLoading,
  items,
  onCreateClick,
  facilityId,
}: InvoicesTableProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("invoices")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("billing_statements")}
          </p>
        </div>
        <Button variant="outline" onClick={onCreateClick}>
          <CareIcon icon="l-plus" className="mr-2 size-4" />
          {t("create_invoice")}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton count={3} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoice_number")}</TableHead>
                <TableHead>{t("title")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!items?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground"
                  >
                    {t("no_invoices")}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>{invoice.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t(invoice.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/facility/${facilityId}/billing/invoices/${invoice.id}`}
                          >
                            <CareIcon icon="l-eye" className="size-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <CareIcon icon="l-print" className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default InvoicesTable;
