import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PencilIcon } from "lucide-react";
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
import { AnnotatedDiscountCode } from "@/pages/Facility/settings/billing/discount/discount-codes/DiscountCodeSettings";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import facilityApi from "@/types/facility/facilityApi";

export function EditDiscountCodePopover({
  code,
  disabled = false,
}: {
  code: AnnotatedDiscountCode;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const facility = useCurrentFacility();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { mutate: updateCode, isPending } = useMutation({
    mutationFn: mutate(facilityApi.updateMonetaryComponents, {
      pathParams: { facilityId: facility?.id ?? "" },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facility", facility?.id] });
      toast.success(t("discount_code_updated"));
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" disabled={disabled || isPending}>
          <PencilIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <DiscountCodeForm
          defaultValues={code}
          onSubmit={(data) => {
            if (!facility) {
              return;
            }

            setOpen(false);

            const updatedCodes = facility.discount_codes.map(
              (existing, index) =>
                index === code.facilityIndex ? data : existing,
            );

            updateCode({
              discount_codes: updatedCodes,
              discount_monetary_components:
                facility.discount_monetary_components,
            });
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
