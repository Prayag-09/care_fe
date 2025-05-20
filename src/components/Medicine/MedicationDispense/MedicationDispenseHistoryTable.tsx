import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { MedicationDispenseDetails } from "@/components/Medicine/MedicationDispense/MedicationDispenseDetails";

import { MedicationDispenseRead } from "@/types/emr/medicationDispense/medicationDispense";

const STATUS_COLORS = {
  preparation: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  on_hold: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  entered_in_error: "bg-gray-100 text-gray-800",
  stopped: "bg-red-100 text-red-800",
  declined: "bg-purple-100 text-purple-800",
};

interface Props {
  data: MedicationDispenseRead[];
  className?: string;
}

export function MedicationDispenseHistoryTable({
  data,
  className = "",
}: Props) {
  const { t } = useTranslation();

  return (
    <div className={`rounded-md border ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("medicine")}</TableHead>
            <TableHead>{t("status")}</TableHead>
            <TableHead>{t("category")}</TableHead>
            <TableHead>{t("prepared_on")}</TableHead>
            <TableHead>{t("handed_over_on")}</TableHead>
            <TableHead>{t("notes")}</TableHead>
            <TableHead className="w-[100px]">{t("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((dispense: MedicationDispenseRead) => (
            <TableRow key={dispense.id}>
              <TableCell>
                {dispense.item.product.product_knowledge.name}
              </TableCell>
              <TableCell>
                <Badge
                  className={STATUS_COLORS[dispense.status]}
                  variant="secondary"
                >
                  {t(dispense.status)}
                </Badge>
              </TableCell>
              <TableCell>{t(dispense.category)}</TableCell>
              <TableCell>
                {format(
                  new Date(dispense.when_prepared),
                  "MMM dd, yyyy, hh:mm a",
                )}
              </TableCell>
              <TableCell>
                {dispense.when_handed_over
                  ? format(
                      new Date(dispense.when_handed_over),
                      "MMM dd, yyyy, hh:mm a",
                    )
                  : "-"}
              </TableCell>
              <TableCell>{dispense.note || "-"}</TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={t("view_details")}
                    >
                      <CareIcon icon="l-eye" className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {t("medication_dispense_details")}
                      </DialogTitle>
                    </DialogHeader>
                    <MedicationDispenseDetails dispense={dispense} />
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
