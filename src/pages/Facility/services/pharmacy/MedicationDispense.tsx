import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "raviger";
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
import useCurrentLocation from "@/pages/Facility/locations/utils/useCurrentLocation";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import {
  MedicationDispenseCategory,
  MedicationDispenseCreate,
  MedicationDispenseNotPerformedReason,
  MedicationDispenseStatus,
  SubstitutionReason,
  SubstitutionType,
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
}

type MedicationRequestWithInventory = MedicationRequestRead & {
  inventory_items_internal?: InventoryRead[];
};

export default function MedicationDispense({ patientId }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { facilityId } = useCurrentFacility();
  const { locationId } = useCurrentLocation();
  const [medicationQuantities, setMedicationQuantities] = useState<
    MedicationQuantity[]
  >([]);

  const { data: response, isLoading } = useQuery({
    queryKey: ["medications", patientId, "dispense"],
    queryFn: async ({ signal }) => {
      // First get the medication requests
      const medicationResponse = await query(medicationRequestApi.list, {
        pathParams: { patientId },
        queryParams: {
          facility: facilityId,
          limit: 100,
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
    onSuccess: () => {
      toast.success(t("medications_dispensed_successfully"));
      queryClient.invalidateQueries({ queryKey: ["medications"] });
      navigate(`../../patient/${patientId}`);
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.detail || t("error_dispensing_medications");
      toast.error(errorMessage);
    },
  });

  const handleQuantityChange = (id: string, value: number) => {
    setMedicationQuantities((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: value } : item,
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

    const requests = selectedMeds
      .map((medication) => {
        const quantity =
          medicationQuantities.find((q) => q.id === medication.id)?.quantity ||
          0;
        const selectedInventory = getInventoryForMedication(medication.id);

        // This check is now redundant due to the validation above, but keeping for type safety
        if (!selectedInventory) {
          return null;
        }

        const dispenseData: MedicationDispenseCreate = {
          status: MedicationDispenseStatus.completed,
          category: MedicationDispenseCategory.outpatient,
          not_performed_reason: MedicationDispenseNotPerformedReason.outofstock,
          when_prepared: new Date(),
          when_handed_over: new Date(),
          note: "",
          dosage_instruction: medication.dosage_instruction[0],
          substitution: {
            was_substituted: false,
            substitution_type: SubstitutionType.N,
            reason: SubstitutionReason.CT,
          },
          encounter: medication.encounter,
          location: locationId,
          authorizing_prescription: medication.id,
          item: selectedInventory.id,
          quantity: quantity,
          days_supply: 30,
        };

        return {
          url: `/api/v1/patient/${patientId}/medication/dispense/`,
          method: "POST",
          reference_id: `dispense_${medication.id}`,
          body: dispenseData,
        };
      })
      .filter(
        (request): request is NonNullable<typeof request> => request !== null,
      );

    dispense({ requests });
  };

  const handleShowAlternatives = (_medicationId: string) => {
    toast.info(t("alternatives_coming_soon"));
  };

  return (
    <Page title={t("dispense_medications")}>
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
              {isPending ? t("dispensing") : t("dispense_selected")}
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
                  <TableHead>{t("availability")}</TableHead>
                  <TableHead>{t("expiry")}</TableHead>
                  <TableHead>{t("quantity")}</TableHead>
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </Page>
  );
}
