import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { CreateInvoiceSheet } from "@/pages/Facility/billing/account/components/CreateInvoiceSheet";
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import {
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import {
  ChargeItemBatchResponse,
  extractChargeItemsFromBatchResponse,
} from "@/types/billing/chargeItem/chargeItem";
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import {
  MedicationDispenseCategory,
  MedicationDispenseCreate,
  MedicationDispenseStatus,
} from "@/types/emr/medicationDispense/medicationDispense";
import { displayMedicationName } from "@/types/emr/medicationRequest/medicationRequest";
import { MedicationRequestRead } from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import { InventoryRead } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";

interface Props {
  patientId: string;
}

interface MedicationQuantity {
  id: string;
  quantity: number;
  isSelected: boolean;
  selectedInventoryId?: string;
  days_supply: number;
  isFullyDispensed: boolean;
}

type MedicationRequestWithInventory = MedicationRequestRead & {
  inventory_items_internal?: InventoryRead[];
};

function convertDurationToDays(value: number, unit: string): number {
  switch (unit) {
    case "h":
      return Math.round(value / 24);
    case "d":
      return value;
    case "wk":
      return value * 7;
    case "mo":
      return value * 30; // approximating month as 30 days
    case "a":
      return value * 365; // approximating year as 365 days
    default:
      return value;
  }
}

export default function MedicationBillForm({ patientId }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { facilityId } = useCurrentFacility();
  const { locationId } = useCurrentLocation();
  const [medicationQuantities, setMedicationQuantities] = useState<
    MedicationQuantity[]
  >([]);
  const [isInvoiceSheetOpen, setIsInvoiceSheetOpen] = useState(false);
  const [extractedChargeItems, setExtractedChargeItems] = useState<
    ChargeItemRead[]
  >([]);

  const { data: account } = useQuery({
    queryKey: ["accounts", patientId],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId },
      queryParams: {
        patient: patientId,
        limit: 1,
        offset: 0,
        status: AccountStatus.active,
        billing_status: AccountBillingStatus.open,
      },
    }),
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["medication_requests", patientId, "dispense"],
    queryFn: async ({ signal }) => {
      // First get the medication requests
      const medicationResponse = await query(medicationRequestApi.list, {
        pathParams: { patientId },
        queryParams: {
          facility: facilityId,
          limit: 100,
          status: "active,on-hold,draft,unknown,ended,completed,cancelled",
        },
      })({ signal });

      // For each medication request, fetch and attach its inventory items
      const medicationsWithInventory = await Promise.all(
        medicationResponse.results.map(
          async (medication: MedicationRequestRead) => {
            if (medication.requested_product?.id) {
              const inventoryResponse = await query(inventoryApi.list, {
                pathParams: { facilityId, locationId },
                queryParams: {
                  limit: 100,
                  product_knowledge: medication.requested_product.id,
                },
              })({ signal });
              return {
                ...medication,
                inventory_items_internal: inventoryResponse.results || [],
              };
            }
            return {
              ...medication,
              inventory_items_internal: [],
            };
          },
        ),
      );

      return {
        ...medicationResponse,
        results: medicationsWithInventory as MedicationRequestWithInventory[],
      };
    },
  });

  const medications =
    response?.results.filter((med) => med.requested_product) || [];

  useEffect(() => {
    if (medications.length > 0) {
      const newMedicationQuantities = medications.map(
        (med: MedicationRequestWithInventory) => {
          const existingQuantity = medicationQuantities.find(
            (q) => q.id === med.id,
          );
          if (existingQuantity) {
            return existingQuantity;
          }

          const matchingInventory = med.inventory_items_internal || [];
          return {
            id: med.id,
            quantity: computeInitialQuantity(med),
            isSelected: true,
            selectedInventoryId:
              matchingInventory.length === 1
                ? matchingInventory[0].id
                : undefined,
            days_supply: convertDurationToDays(
              med.dosage_instruction[0]?.timing?.repeat?.bounds_duration
                ?.value || 0,
              med.dosage_instruction[0]?.timing?.repeat?.bounds_duration
                ?.unit || "",
            ),
            isFullyDispensed: false,
          };
        },
      );

      if (
        JSON.stringify(newMedicationQuantities) !==
        JSON.stringify(medicationQuantities)
      ) {
        setMedicationQuantities(newMedicationQuantities);
      }
    }
  }, [medications]);

  function computeInitialQuantity(medication: any) {
    const instruction = medication.dosage_instruction[0];
    if (!instruction) return 0;

    const dosage = instruction.dose_and_rate?.dose_quantity?.value || 0;
    const duration = instruction.timing?.repeat?.bounds_duration?.value || 0;
    const frequency = instruction.timing?.code?.code || "";

    let dosesPerDay = 1;
    if (frequency.includes("BID")) dosesPerDay = 2;
    if (frequency.includes("TID")) dosesPerDay = 3;
    if (frequency.includes("QID")) dosesPerDay = 4;

    return dosage * dosesPerDay * duration;
  }

  const { mutate: dispense, isPending } = useMutation({
    mutationFn: mutate(routes.batchRequest),
    onSuccess: (response) => {
      toast.success(t("medications_dispensed_successfully"));
      queryClient.invalidateQueries({ queryKey: ["medications"] });

      // Extract charge items and open invoice sheet
      const chargeItems = extractChargeItemsFromBatchResponse(
        response as unknown as ChargeItemBatchResponse,
      );
      setExtractedChargeItems(chargeItems);
      setIsInvoiceSheetOpen(true);
    },
    onError: (error) => {
      try {
        const errorData = error.cause as {
          results?: {
            data?: { detail?: string; errors?: { msg: string }[] };
          }[];
        };

        const errorMessages = errorData?.results
          ?.flatMap(
            (result) =>
              result?.data?.errors?.map((err) => err.msg) || // Extract from `errors[].msg`
              (result?.data?.detail ? [result.data.detail] : []), // Extract from `data.detail`
          )
          .filter(Boolean); // Remove undefined/null values

        if (errorMessages?.length) {
          errorMessages.forEach((msg) => toast.error(msg));
        } else {
          toast.error(t("error_dispensing_medications"));
        }
      } catch {
        toast.error(t("error_dispensing_medications"));
      }
    },
  });

  const handleQuantityChange = (id: string, value: number) => {
    setMedicationQuantities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: value } : item,
      ),
    );
  };

  const handleDaysSupplyChange = (id: string, value: number) => {
    setMedicationQuantities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, days_supply: value } : item,
      ),
    );
  };

  const handleInventoryChange = (id: string, inventoryId: string) => {
    setMedicationQuantities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selectedInventoryId: inventoryId } : item,
      ),
    );
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setMedicationQuantities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isSelected: checked } : item,
      ),
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setMedicationQuantities((prev) =>
      prev.map((item) => ({ ...item, isSelected: checked })),
    );
  };

  const handleFullyDispensedChange = (id: string, checked: boolean) => {
    setMedicationQuantities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFullyDispensed: checked } : item,
      ),
    );
  };

  const getInventoryForMedication = (
    medicationId: string,
  ): InventoryRead | undefined => {
    const medication = medications.find(
      (med: MedicationRequestWithInventory) => med.id === medicationId,
    );
    const quantity = medicationQuantities.find((q) => q.id === medicationId);
    if (!quantity?.selectedInventoryId || !medication) return undefined;

    return medication.inventory_items_internal?.find(
      (inv: InventoryRead) => inv.id === quantity.selectedInventoryId,
    );
  };

  const calculatePrices = (inventory: InventoryRead | undefined) => {
    if (!inventory)
      return {
        basePrice: 0,
      };

    const priceComponents =
      inventory.product.charge_item_definition.price_components;

    // Get base price
    const baseComponent = priceComponents.find(
      (component) =>
        component.monetary_component_type === MonetaryComponentType.base,
    );
    const basePrice = baseComponent?.amount || 0;

    return {
      basePrice,
    };
  };

  const handleDispense = () => {
    const selectedMeds = medications.filter((med) =>
      medicationQuantities.find((q) => q.id === med.id && q.isSelected),
    );

    // First check for any selected medications with zero quantity
    const medWithZeroQuantity = selectedMeds.find((med) => {
      const quantity =
        medicationQuantities.find((q) => q.id === med.id)?.quantity || 0;
      return quantity === 0;
    });

    if (medWithZeroQuantity) {
      toast.error(
        t("quantity_cannot_be_zero", {
          medication: displayMedicationName(medWithZeroQuantity),
        }),
      );
      return;
    }

    // First validate that all selected medications have an inventory selected
    const medsWithoutInventory = selectedMeds.filter((med) => {
      const quantity = medicationQuantities.find((q) => q.id === med.id);
      return !quantity?.selectedInventoryId;
    });

    if (medsWithoutInventory.length > 0) {
      const medicationNames = medsWithoutInventory
        .map((med) => displayMedicationName(med))
        .join(", ");
      toast.error(
        t("please_select_inventory_for_medications", {
          medications: medicationNames,
        }),
      );
      return;
    }

    const requests = [];

    // Add all dispense requests
    selectedMeds.forEach((medication) => {
      const medicationQuantity = medicationQuantities.find(
        (q) => q.id === medication.id,
      );
      const quantity = medicationQuantity?.quantity || 0;
      const selectedInventory = getInventoryForMedication(medication.id);
      const daysSupply = medicationQuantity?.days_supply || 0;

      // This check is now redundant due to the validation above, but keeping for type safety
      if (!selectedInventory) {
        return;
      }

      const dispenseData: MedicationDispenseCreate = {
        status: MedicationDispenseStatus.preparation,
        category: MedicationDispenseCategory.outpatient,
        when_prepared: new Date(),
        dosage_instruction: medication.dosage_instruction[0],
        encounter: medication.encounter,
        location: locationId,
        authorizing_prescription: medication.id,
        item: selectedInventory.id,
        quantity: quantity,
        days_supply: daysSupply,
      };

      requests.push({
        url: `/api/v1/medication/dispense/`,
        method: "POST",
        reference_id: `dispense_${medication.id}`,
        body: dispenseData,
      });
    });

    // Get all medications marked as fully dispensed
    const fullyDispensedMeds = selectedMeds.filter((med) =>
      medicationQuantities.find((q) => q.id === med.id && q.isFullyDispensed),
    );

    // If there are any fully dispensed medications, add a single upsert request
    if (fullyDispensedMeds.length > 0) {
      requests.push({
        url: `/api/v1/patient/${patientId}/medication/request/upsert/`,
        method: "POST",
        reference_id: "medication_request_updates",
        body: {
          datapoints: fullyDispensedMeds.map((medication) => ({
            ...medication,
            dispense_status: "complete",
          })),
        },
      });
    }

    dispense({ requests });
  };

  const handleShowAlternatives = (_medicationId: string) => {
    toast.info(t("alternatives_coming_soon"));
  };

  return (
    <Page title={t("bill_medications")}>
      <div className="container mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2 justify-end w-full">
            <Button
              variant="outline"
              onClick={() => navigate(`../${patientId}`)}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleDispense}
              disabled={
                !medicationQuantities.some((q) => q.isSelected) || isPending
              }
            >
              {isPending ? t("billing") : t("bill_selected")}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton count={5} />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        medicationQuantities.length > 0 &&
                        medicationQuantities.every((q) => q.isSelected)
                      }
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    />
                  </TableHead>
                  <TableHead>{t("medicine")}</TableHead>
                  <TableHead>{t("select_lot")}</TableHead>
                  <TableHead>{t("expiry")}</TableHead>
                  <TableHead>{t("quantity")}</TableHead>
                  <TableHead>{t("days_supply")}</TableHead>
                  <TableHead>{t("price")}</TableHead>
                  <TableHead>{t("discount")}</TableHead>
                  {Array.from(
                    new Set(
                      medications
                        .flatMap(
                          (med) =>
                            med.inventory_items_internal?.flatMap((inventory) =>
                              inventory.product.charge_item_definition.price_components
                                .filter(
                                  (c: any) =>
                                    c.monetary_component_type ===
                                    MonetaryComponentType.tax,
                                )
                                .map((c) => c.code?.code || "tax_per_unit"),
                            ) || [],
                        )
                        .filter(Boolean),
                    ),
                  ).map((taxCode) => (
                    <TableHead key={taxCode}>
                      {t(taxCode || "tax_per_unit")}
                    </TableHead>
                  ))}
                  <TableHead>{t("actions")}</TableHead>
                  <TableHead>{t("is_fully_dispensed")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medications.map((medication) => {
                  const medicationQuantity = medicationQuantities.find(
                    (q) => q.id === medication.id,
                  );
                  const quantity = medicationQuantity?.quantity || 0;
                  const matchingInventory =
                    medication.inventory_items_internal || [];
                  const selectedInventory = getInventoryForMedication(
                    medication.id,
                  );
                  const prices = calculatePrices(selectedInventory);

                  // Get all possible tax codes for the current medication
                  const allTaxCodes = Array.from(
                    new Set(
                      medications
                        .flatMap(
                          (med) =>
                            med.inventory_items_internal?.flatMap((inventory) =>
                              inventory.product.charge_item_definition.price_components
                                .filter(
                                  (c: any) =>
                                    c.monetary_component_type ===
                                    MonetaryComponentType.tax,
                                )
                                .map((c) => c.code?.code || "tax_per_unit"),
                            ) || [],
                        )
                        .filter(Boolean),
                    ),
                  );

                  return (
                    <TableRow key={medication.id}>
                      <TableCell>
                        <Checkbox
                          checked={medicationQuantity?.isSelected}
                          onCheckedChange={(checked) =>
                            handleCheckboxChange(medication.id, !!checked)
                          }
                        />
                      </TableCell>
                      <TableCell>{displayMedicationName(medication)}</TableCell>
                      <TableCell>
                        {matchingInventory.length > 0 ? (
                          <Select
                            value={medicationQuantity?.selectedInventoryId}
                            onValueChange={(value) =>
                              handleInventoryChange(medication.id, value)
                            }
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue
                                placeholder={
                                  matchingInventory.length === 0
                                    ? t("no_stock")
                                    : t("select_stock")
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {matchingInventory.map((inv) => (
                                <SelectItem key={inv.id} value={inv.id}>
                                  {"Lot #" + inv.product.batch?.lot_number}{" "}
                                  <Badge
                                    variant={
                                      inv.status === "active" &&
                                      inv.net_content > 0
                                        ? "primary"
                                        : "destructive"
                                    }
                                  >
                                    {inv.net_content} {t("units")}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="destructive">{t("no_stock")}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {selectedInventory?.product.expiration_date || "-"}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={quantity}
                          onChange={(e) =>
                            handleQuantityChange(
                              medication.id,
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          value={medicationQuantity?.days_supply || 0}
                          onChange={(e) =>
                            handleDaysSupplyChange(
                              medication.id,
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <MonetaryDisplay amount={prices.basePrice} />
                      </TableCell>
                      <TableCell>
                        {selectedInventory
                          ? selectedInventory.product.charge_item_definition.price_components
                              .filter(
                                (c) =>
                                  c.monetary_component_type ===
                                  MonetaryComponentType.discount,
                              )
                              .map((component, index) => (
                                <div key={index}>
                                  {component.factor
                                    ? `${component.factor}%`
                                    : "-"}
                                </div>
                              ))
                          : "-"}
                      </TableCell>
                      {allTaxCodes.map((taxCode) => {
                        const taxComponent =
                          selectedInventory?.product.charge_item_definition.price_components.find(
                            (c: any) =>
                              c.monetary_component_type ===
                                MonetaryComponentType.tax &&
                              (c.code?.code || "tax_per_unit") === taxCode,
                          );
                        return (
                          <TableCell key={`${medication.id}-${taxCode}`}>
                            {selectedInventory ? (
                              <div>
                                {taxComponent?.factor
                                  ? `${taxComponent.factor}%`
                                  : "-"}
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShowAlternatives(medication.id)}
                        >
                          {t("alt")}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={medicationQuantity?.isFullyDispensed}
                          onCheckedChange={(checked) =>
                            handleFullyDispensedChange(medication.id, !!checked)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {account?.results[0] && (
          <CreateInvoiceSheet
            facilityId={facilityId}
            accountId={account?.results[0].id}
            open={isInvoiceSheetOpen}
            onOpenChange={setIsInvoiceSheetOpen}
            preSelectedChargeItems={extractedChargeItems}
            onSuccess={() => {
              setIsInvoiceSheetOpen(false);
              navigate(
                `/facility/${facilityId}/locations/${locationId}/medication_requests/patient/${patientId}/to_be_dispensed`,
              );
            }}
          />
        )}
      </div>
    </Page>
  );
}
