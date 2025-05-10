import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import mutate from "@/Utils/request/mutate";
import { DiscountCodeForm } from "@/pages/Facility/settings/billing/discount/discount-codes/DiscountCodeForm";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import facilityApi from "@/types/facility/facilityApi";

export function CreateDiscountCodePopover() {
  const { t } = useTranslation();
  const { facility, facilityId } = useCurrentFacility();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutate: createCode } = useMutation({
    mutationFn: mutate(facilityApi.updateMonetaryComponents, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility", facility?.id] });
      toast.success(t("discount_code_created"));
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon />
          {t("create_discount_code")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <DiscountCodeForm
          onSubmit={(data) => {
            if (!facility) {
              return;
            }

            setOpen(false);
            createCode({
              discount_codes: [...(facility.discount_codes ?? []), data],
              discount_monetary_components:
                facility.discount_monetary_components,
            });
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
