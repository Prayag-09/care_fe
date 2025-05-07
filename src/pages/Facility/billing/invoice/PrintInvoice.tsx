import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { differenceInYears, format } from "date-fns";
import React from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import { MonetoryDisplay } from "@/components/ui/monetory-display";
import { Separator } from "@/components/ui/separator";

import Loading from "@/components/Common/Loading";

import query from "@/Utils/request/query";
import {
  MonetoryComponent,
  MonetoryComponentType,
} from "@/types/base/monetoryComponent/monetoryComponent";
import invoiceApi from "@/types/billing/invoice/invoiceApi";

type PrintInvoiceProps = {
  facilityId: string;
  invoiceId: string;
};

interface PriceComponentRowProps {
  label: string;
  components: MonetoryComponent[];
  totalPriceComponents: MonetoryComponent[];
}

function PriceComponentRow({
  label,
  components,
  totalPriceComponents,
}: PriceComponentRowProps) {
  if (!components.length) return null;

  return (
    <>
      {components.map((component, index) => {
        return (
          <tr
            key={`${label}-${index}`}
            className="text-xs text-gray-500 bg-muted/30"
          >
            <td className="py-2 pl-8">
              {component.code && `${component.code.display} `}({label})
            </td>
            <td className="py-2 text-right">
              <MonetoryDisplay {...component} />
            </td>
            <td className="py-2 text-right"></td>
            <td className="py-2 text-right">
              {component.monetory_component_type ===
              MonetoryComponentType.discount
                ? "- "
                : "+ "}
              <MonetoryDisplay amount={totalPriceComponents[index]?.amount} />
            </td>
          </tr>
        );
      })}
    </>
  );
}

export function PrintInvoice({ facilityId, invoiceId }: PrintInvoiceProps) {
  const { t } = useTranslation();

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: query(invoiceApi.retrieveInvoice, {
      pathParams: { facilityId, invoiceId },
    }),
  });

  if (isLoading || !invoice) {
    return <Loading />;
  }

  const patient = invoice.account.patient;
  const age = patient.date_of_birth
    ? differenceInYears(new Date(), new Date(patient.date_of_birth))
    : null;

  return (
    <PrintPreview title={`${t("invoice")} #${invoice.id}`}>
      <div className="min-h-screen py-8 max-w-4xl mx-auto">
        {/* Header with Facility Name and Logo */}
        <div className="flex justify-between items-start pb-6 border-b border-gray-200">
          <div className="space-y-4 flex-1">
            <div>
              <h1 className="text-3xl font-semibold">{invoice.title}</h1>
              <h2 className="text-gray-500 uppercase text-sm tracking-wide font-semibold mt-1">
                {t("invoice")} #{invoice.id}
              </h2>
            </div>
          </div>
          <img
            src={careConfig.mainLogo?.dark}
            alt="Care Logo"
            className="h-10 w-auto object-contain ml-6"
          />
        </div>

        {/* Invoice Information */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bill To Section */}
          <div>
            <h3 className="text-gray-500 font-semibold mb-2">{t("bill_to")}</h3>
            <div className="space-y-1">
              <p className="font-medium text-lg">{patient.name}</p>
              <p className="text-sm text-gray-600">
                {age !== null && `${age} ${t("years")} • `}
                {patient.gender && `${t(patient.gender)} • `}
                {formatPhoneNumberIntl(patient.phone_number)}
              </p>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {patient.address}
              </p>
              <p className="text-sm text-gray-600">{patient.pincode}</p>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">{t("invoice_date")}</span>
              <span>{format(new Date(), "dd MMM yyyy")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t("invoice_number")}</span>
              <span>{invoice.id}</span>
            </div>
            {invoice.note && (
              <div className="mt-4">
                <span className="text-gray-500">{t("note")}</span>
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {invoice.note}
                </p>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-8" />

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-sm">
                <th className="pb-2 text-left font-medium text-gray-500">
                  {t("item")}
                </th>
                <th className="pb-2 text-right font-medium text-gray-500">
                  {t("unit_price")}
                </th>
                <th className="pb-2 text-right font-medium text-gray-500">
                  {t("qty")}
                </th>
                <th className="pb-2 text-right font-medium text-gray-500">
                  {t("amount")}
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.charge_items.map((item) => {
                const baseComponent = item.unit_price_components?.find(
                  (c) =>
                    c.monetory_component_type === MonetoryComponentType.base,
                );
                const baseAmount = baseComponent?.amount || 0;

                const getUnitComponentsByType = (
                  type: MonetoryComponentType,
                ) => {
                  return (
                    item.unit_price_components?.filter(
                      (c) => c.monetory_component_type === type,
                    ) || []
                  );
                };

                const getTotalComponentsByType = (
                  type: MonetoryComponentType,
                ) => {
                  return (
                    item.total_price_components?.filter(
                      (c) => c.monetory_component_type === type,
                    ) || []
                  );
                };

                return (
                  <React.Fragment key={item.id}>
                    <tr className="border-b">
                      <td className="py-4">
                        <div>
                          <div>{item.title}</div>
                          <div className="text-xs text-gray-500">{item.id}</div>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <MonetoryDisplay amount={baseAmount} />
                      </td>
                      <td className="py-4 text-right">{item.quantity}</td>
                      <td className="py-4 text-right">
                        <MonetoryDisplay amount={item.total_price} />
                      </td>
                    </tr>
                    <PriceComponentRow
                      label={t("surcharges")}
                      components={getUnitComponentsByType(
                        MonetoryComponentType.surcharge,
                      )}
                      totalPriceComponents={getTotalComponentsByType(
                        MonetoryComponentType.surcharge,
                      )}
                    />
                    <PriceComponentRow
                      label={t("discounts")}
                      components={getUnitComponentsByType(
                        MonetoryComponentType.discount,
                      )}
                      totalPriceComponents={getTotalComponentsByType(
                        MonetoryComponentType.discount,
                      )}
                    />
                    <PriceComponentRow
                      label={t("taxes")}
                      components={getUnitComponentsByType(
                        MonetoryComponentType.tax,
                      )}
                      totalPriceComponents={getTotalComponentsByType(
                        MonetoryComponentType.tax,
                      )}
                    />
                    <tr className="bg-muted/30 font-medium">
                      <td className="py-2 pl-8">{t("total")}</td>
                      <td></td>
                      <td></td>
                      <td className="py-2 text-right">
                        <MonetoryDisplay amount={item.total_price} />
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex flex-col items-end space-y-2 mt-6">
          {/* Base Amount */}
          {invoice.total_price_components
            ?.filter(
              (c) => c.monetory_component_type === MonetoryComponentType.base,
            )
            .map((component, index) => (
              <div key={`base-${index}`} className="flex w-64 justify-between">
                <span className="text-gray-500">
                  {component.code?.display || t("base_amount")}
                </span>
                <MonetoryDisplay amount={component.amount} fallback="-" />
              </div>
            ))}

          {/* Surcharges */}
          {invoice.total_price_components
            ?.filter(
              (c) =>
                c.monetory_component_type === MonetoryComponentType.surcharge,
            )
            .map((component, index) => (
              <div
                key={`surcharge-${index}`}
                className="flex w-64 justify-between text-gray-500 text-sm"
              >
                <span>
                  {component.code && `${component.code.display} `}(
                  {t("surcharge")})
                </span>
                <span>
                  + <MonetoryDisplay {...component} />
                </span>
              </div>
            ))}

          {/* Discounts */}
          {invoice.total_price_components
            ?.filter(
              (c) =>
                c.monetory_component_type === MonetoryComponentType.discount,
            )
            .map((component, index) => (
              <div
                key={`discount-${index}`}
                className="flex w-64 justify-between text-gray-500 text-sm"
              >
                <span>
                  {component.code && `${component.code.display} `}(
                  {t("discount")})
                </span>
                <span>
                  - <MonetoryDisplay {...component} />
                </span>
              </div>
            ))}

          {/* Taxes */}
          {invoice.total_price_components
            ?.filter(
              (c) => c.monetory_component_type === MonetoryComponentType.tax,
            )
            .map((component, index) => (
              <div
                key={`tax-${index}`}
                className="flex w-64 justify-between text-gray-500 text-sm"
              >
                <span>
                  {component.code && `${component.code.display} `}({t("tax")})
                </span>
                <span>
                  + <MonetoryDisplay {...component} />
                </span>
              </div>
            ))}

          <Separator className="my-2" />

          {/* Subtotal */}
          <div className="flex w-64 justify-between">
            <span className="text-gray-500">{t("net_amount")}</span>
            <MonetoryDisplay amount={invoice.total_net} />
          </div>

          {/* Total */}
          <div className="flex w-64 justify-between font-bold">
            <span>{t("total")}</span>
            <MonetoryDisplay amount={invoice.total_gross} />
          </div>
        </div>

        {/* Footer with Terms */}
        {invoice.payment_terms && (
          <div className="mt-10 text-sm text-gray-600 border-t pt-4">
            <h3 className="font-medium mb-2">{t("payment_terms")}</h3>
            <p className="prose w-full text-sm whitespace-pre-wrap">
              {invoice.payment_terms}
            </p>
          </div>
        )}

        {/* Generated Info */}
        <div className="mt-12 pt-4 border-t text-[10px] text-gray-500 flex justify-between">
          <p>
            {t("generated_on")} {format(new Date(), "PPP 'at' p")}
          </p>
        </div>
      </div>
    </PrintPreview>
  );
}

export default PrintInvoice;
