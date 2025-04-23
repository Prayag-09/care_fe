// TODO: This is a temporary fix to the location multi select.
// This doesn't account for nested locations.
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import query from "@/Utils/request/query";
import { type LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface LocationMultiSelectProps {
  facilityId: string;
  value: string[];
  onChange: (value: string[]) => void;
}

export default function LocationMultiSelect({
  facilityId,
  value,
  onChange,
}: LocationMultiSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const { data: response } = useQuery({
    queryKey: ["locations", facilityId],
    queryFn: query(locationApi.list, {
      pathParams: {
        facility_id: facilityId,
      },
    }),
  });

  const locations = response?.results || [];

  const selectedLocations = locations.filter((location: LocationList) =>
    value.includes(location.id),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedLocations.length > 0
            ? `${selectedLocations.length} ${t("locations_selected")}`
            : t("select_locations")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={t("search_locations")} />
          <CommandEmpty>{t("no_locations_found")}</CommandEmpty>
          <CommandGroup>
            {locations.map((location: LocationList) => (
              <CommandItem
                key={location.id}
                onSelect={() => {
                  const newValue = value.includes(location.id)
                    ? value.filter((id) => id !== location.id)
                    : [...value, location.id];
                  onChange(newValue);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.includes(location.id) ? "opacity-100" : "opacity-0",
                  )}
                />
                {location.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
