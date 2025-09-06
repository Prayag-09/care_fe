import { useQuery } from "@tanstack/react-query";
import { WalletMinimal } from "lucide-react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { ChargeItemDefinitionForm } from "@/pages/Facility/settings/chargeItemDefinitions/ChargeItemDefinitionForm";
import { ChargeItemDefinitionStatus } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import query from "@/Utils/request/query";
import { mergeAutocompleteOptions } from "@/Utils/utils";
import { useState } from "react";

interface ScheduleChargeItemDefinitionSelectorProps {
  facilityId: string;
  value?: string;
  onChange: (value: {
    charge_item_definition: string;
    re_visit_allowed_days: number;
    re_visit_charge_item_definition?: string;
  }) => void;
}

export default function ScheduleChargeItemDefinitionSelector({
  facilityId,
  value,
  onChange,
}: ScheduleChargeItemDefinitionSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCid, setSelectedCid] = useState(value);
  const [reVisitDays, setReVisitDays] = useState(0);
  const [reVisitCid, setReVisitCid] = useState<string>();
  const [_reVisitSearch, setReVisitSearch] = useState("");

  const { data: chargeItemDefinitions, isLoading } = useQuery({
    queryKey: ["chargeItemDefinitions", facilityId, search],
    queryFn: query.debounced(chargeItemDefinitionApi.listChargeItemDefinition, {
      pathParams: { facilityId },
      queryParams: {
        limit: 100,
        title: search,
        status: ChargeItemDefinitionStatus.active,
      },
    }),
  });

  const handleSubmit = () => {
    if (selectedCid) {
      onChange({
        charge_item_definition: selectedCid,
        re_visit_allowed_days: reVisitDays,
        re_visit_charge_item_definition: reVisitCid,
      });
      setIsOpen(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-full gap-2">
          <WalletMinimal className="size-4" />
          <span className="text-gray-950 font-medium">
            {t("manage_charges")}
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[90%] sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{t("select_charge_item_definitions")}</SheetTitle>
          <SheetDescription>
            {t("select_or_create_charge_item_definitions")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div>
                <Label>{t("consulation charge")}</Label>
                <div className="mt-2 flex gap-2 flex-row">
                  <Autocomplete
                    options={mergeAutocompleteOptions(
                      chargeItemDefinitions?.results.map((cid) => ({
                        label: cid.title,
                        value: cid.id,
                      })) || [],
                      value
                        ? {
                            label:
                              chargeItemDefinitions?.results.find(
                                (cid) => cid.id === value,
                              )?.title || "",
                            value: value,
                          }
                        : undefined,
                    )}
                    value={selectedCid || ""}
                    onChange={setSelectedCid}
                    onSearch={setSearch}
                    placeholder={t("select_charge_item_definition")}
                    isLoading={isLoading}
                    noOptionsMessage={t("no_charge_item_definitions_found")}
                  />
                  <Sheet
                    open={isCreateSheetOpen}
                    onOpenChange={setIsCreateSheetOpen}
                  >
                    <SheetTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        {t("create_new")}
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[90%] sm:max-w-2xl flex min-w-full flex-col bg-gray-100 sm:min-w-fit overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>
                          {t("create_charge_item_definition")}
                        </SheetTitle>
                        <SheetDescription>
                          {t("create_charge_item_definition_description")}
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6">
                        <ChargeItemDefinitionForm
                          facilityId={facilityId}
                          onSuccess={() => setIsCreateSheetOpen(false)}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              <div>
                <Label>{t("re_visit_allowed_days")}</Label>
                <div className="mt-2">
                  <Input
                    type="number"
                    min={0}
                    value={reVisitDays}
                    onChange={(e) =>
                      setReVisitDays(parseInt(e.target.value) || 0)
                    }
                    placeholder={t("enter_re_visit_allowed_days")}
                  />
                </div>
              </div>

              <div>
                <Label>{t("re_visit_consultation_charge")}</Label>
                <div className="mt-2 flex gap-2 flex-row">
                  <Autocomplete
                    options={mergeAutocompleteOptions(
                      chargeItemDefinitions?.results.map((cid) => ({
                        label: cid.title,
                        value: cid.id,
                      })) || [],
                      reVisitCid
                        ? {
                            label:
                              chargeItemDefinitions?.results.find(
                                (cid) => cid.id === reVisitCid,
                              )?.title || "",
                            value: reVisitCid,
                          }
                        : undefined,
                    )}
                    value={reVisitCid || ""}
                    onChange={setReVisitCid}
                    onSearch={setReVisitSearch}
                    placeholder={t("select_charge_item_definition")}
                    isLoading={isLoading}
                    noOptionsMessage={t("no_charge_item_definitions_found")}
                  />
                  <Sheet
                    open={isCreateSheetOpen}
                    onOpenChange={setIsCreateSheetOpen}
                  >
                    <SheetTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        {t("create_new")}
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[90%] sm:max-w-2xl flex min-w-full flex-col bg-gray-100 sm:min-w-fit overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle>
                          {t("create_charge_item_definition")}
                        </SheetTitle>
                        <SheetDescription>
                          {t("create_charge_item_definition_description")}
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6">
                        <ChargeItemDefinitionForm
                          facilityId={facilityId}
                          onSuccess={() => setIsCreateSheetOpen(false)}
                        />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedCid}
              className="w-full sm:w-auto"
            >
              {t("save")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
