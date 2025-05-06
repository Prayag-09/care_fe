import { PencilIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { MonetoryComponentRead } from "@/types/base/monetoryComponent/monetoryComponent";
import { Code } from "@/types/questionnaire/code";

import { DiscountMonetoryComponentForm } from "./DiscountMonetoryComponentForm";

export function EditDiscountMonetoryPopover({
  component,
  ...props
}: {
  component: MonetoryComponentRead;
  onSubmit: (data: MonetoryComponentRead) => void;
  systemCodes: Code[];
  facilityCodes: Code[];
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <PencilIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <DiscountMonetoryComponentForm defaultValues={component} {...props} />
      </PopoverContent>
    </Popover>
  );
}
