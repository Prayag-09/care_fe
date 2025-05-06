import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { MonetoryComponentRead } from "@/types/base/monetoryComponent/monetoryComponent";
import { Code } from "@/types/questionnaire/code";

import { DiscountMonetoryComponentForm } from "./DiscountMonetoryComponentForm";

export function CreateDiscountMonetaryComponentPopover(props: {
  onSubmit: (data: MonetoryComponentRead) => void;
  systemCodes: Code[];
  facilityCodes: Code[];
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon />
          Create Discount Component
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="pt-4">
          <DiscountMonetoryComponentForm {...props} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
