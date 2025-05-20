import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

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
  dispense: MedicationDispenseRead;
}

export function MedicationDispenseDetails({ dispense }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500">{t("medicine")}</h4>
          <p className="mt-1">{dispense.item.product.product_knowledge.name}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">{t("status")}</h4>
          <Badge
            className={`mt-1 ${STATUS_COLORS[dispense.status]}`}
            variant="secondary"
          >
            {t(dispense.status)}
          </Badge>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">{t("category")}</h4>
          <p className="mt-1">{t(dispense.category)}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">
            {t("prepared_on")}
          </h4>
          <p className="mt-1">
            {format(new Date(dispense.when_prepared), "MMM dd, yyyy, hh:mm a")}
          </p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">
            {t("handed_over_on")}
          </h4>
          <p className="mt-1">
            {dispense.when_handed_over
              ? format(
                  new Date(dispense.when_handed_over),
                  "MMM dd, yyyy, hh:mm a",
                )
              : "-"}
          </p>
        </div>
        {dispense.not_performed_reason && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">
              {t("not_performed_reason")}
            </h4>
            <p className="mt-1">{t(dispense.not_performed_reason)}</p>
          </div>
        )}
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-base font-semibold">{t("product_details")}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">
              {t("product_name")}
            </h4>
            <p className="mt-1">
              {dispense.item.product.product_knowledge.name}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">
              {t("net_content")}
            </h4>
            <p className="mt-1">{dispense.item.net_content}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">{t("batch")}</h4>
            <p className="mt-1">
              {dispense.item.product.batch?.lot_number || "-"}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">
              {t("expiration_date")}
            </h4>
            <p className="mt-1">
              {dispense.item.product.expiration_date
                ? format(
                    new Date(dispense.item.product.expiration_date),
                    "MMM dd, yyyy",
                  )
                : "-"}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">
              {t("product_status")}
            </h4>
            <p className="mt-1">{t(dispense.item.product.status)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <h3 className="mb-3 text-base font-semibold">
          {t("charge_item_details")}
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">{t("title")}</h4>
            <p className="mt-1">{dispense.charge_item.title}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">{t("status")}</h4>
            <p className="mt-1">{t(dispense.charge_item.status)}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">
              {t("quantity")}
            </h4>
            <p className="mt-1">{dispense.charge_item.quantity}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">
              {t("total_price")}
            </h4>
            <p className="mt-1">{dispense.charge_item.total_price}</p>
          </div>
          {dispense.charge_item.description && (
            <div className="col-span-2">
              <h4 className="text-sm font-medium text-gray-500">
                {t("description")}
              </h4>
              <p className="mt-1">{dispense.charge_item.description}</p>
            </div>
          )}
          {dispense.charge_item.note && (
            <div className="col-span-2">
              <h4 className="text-sm font-medium text-gray-500">{t("note")}</h4>
              <p className="mt-1">{dispense.charge_item.note}</p>
            </div>
          )}
        </div>
      </div>

      {dispense.note && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-base font-semibold">{t("notes")}</h3>
          <p>{dispense.note}</p>
        </div>
      )}

      {dispense.substitution && (
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 text-base font-semibold">
            {t("substitution_details")}
          </h3>
          <div className="space-y-2">
            <p>
              <span className="font-medium">{t("was_substituted")}:</span>{" "}
              {dispense.substitution.was_substituted ? t("yes") : t("no")}
            </p>
            {dispense.substitution.was_substituted && (
              <>
                <p>
                  <span className="font-medium">{t("substitution_type")}:</span>{" "}
                  {t(dispense.substitution.substitution_type)}
                </p>
                <p>
                  <span className="font-medium">{t("reason")}:</span>{" "}
                  {t(dispense.substitution.reason)}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
