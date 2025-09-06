import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import { useTranslation } from "react-i18next";
import { EditInvoiceTable } from "./EditInvoiceTable";

interface EditInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  chargeItems: ChargeItemRead[];
}

export function EditInvoiceDialog({
  open,
  onOpenChange,
  facilityId,
  chargeItems,
}: EditInvoiceDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-3xl overflow-auto">
        <DialogHeader>
          <DialogTitle>{t("edit_invoice_items")}</DialogTitle>
        </DialogHeader>
        <EditInvoiceTable
          facilityId={facilityId}
          chargeItems={chargeItems}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
