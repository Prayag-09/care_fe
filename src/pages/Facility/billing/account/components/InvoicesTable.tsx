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

import { InvoiceRead, InvoiceStatus } from "@/types/billing/invoice/invoice";

function formatCurrency(amount: number, currency: string = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(amount);
}

const statusMap: Record<
  InvoiceStatus,
  {
    label: string;
    variant: "default" | "secondary" | "primary" | "destructive" | "outline";
  }
> = {
  [InvoiceStatus.draft]: { label: "draft", variant: "secondary" },
  [InvoiceStatus.issued]: { label: "issued", variant: "default" },
  [InvoiceStatus.balanced]: { label: "balanced", variant: "primary" },
  [InvoiceStatus.cancelled]: { label: "cancelled", variant: "destructive" },
  [InvoiceStatus.entered_in_error]: {
    label: "entered_in_error",
    variant: "destructive",
  },
};

export interface InvoicesTableProps {
  isLoading: boolean;
  items?: InvoiceRead[];
  onCreateClick: () => void;
  facilityId: string;
  accountId: string;
}

export function InvoicesTable({
  isLoading,
  items,
  onCreateClick,
  facilityId,
  accountId,
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
        <div className="flex gap-2">
          <Button variant="ghost" asChild>
            <Link
              href={`/facility/${facilityId}/billing/payments?accountId=${accountId}`}
            >
              <CareIcon icon="l-wallet" className="mr-2 size-4" />
              {t("view_payments")}
            </Link>
          </Button>
          <Button variant="outline" onClick={onCreateClick}>
            <CareIcon icon="l-plus" className="mr-2 size-4" />
            {t("create_invoice")}
          </Button>
        </div>
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
                <TableHead>{t("total")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!items?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
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
                      <Badge variant={statusMap[invoice.status].variant}>
                        {t(statusMap[invoice.status].label)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.total_gross)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/facility/${facilityId}/billing/invoices/${invoice.id}`}
                          >
                            <CareIcon icon="l-eye" className="size-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/facility/${facilityId}/billing/invoice/${invoice.id}/print`}
                          >
                            <CareIcon icon="l-print" className="size-4" />
                          </Link>
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
