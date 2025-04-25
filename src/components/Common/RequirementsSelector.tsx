import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import * as React from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

interface RequirementsSelectorProps {
  title: string;
  description?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: {
    label: string;
    value: string;
    details: { label: string; value: string | undefined }[];
  }[];
  isLoading: boolean;
  placeholder: string;
  onSearch?: (query: string) => void;
  customSelector?: React.ReactNode;
  canCreate?: boolean;
  createForm?: React.ReactNode;
}

function SelectedItemCard({
  title,
  details,
  onRemove,
}: {
  title: string;
  details: { label: string; value: string | undefined }[];
  onRemove: () => void;
}) {
  return (
    <div className="w-full relative flex flex-col rounded-sm border border-gray-200 bg-white px-2 py-1">
      <Button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-2 top-0 rounded-full p-1 cursor-pointer"
        variant="ghost"
      >
        <Trash2 className="size-4 text-gray-500" />
      </Button>
      <p className="mb-2 font-medium text-sm text-gray-900">{title}</p>
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
        {details
          .filter(({ value }) => value)
          .map(({ label, value }, index) => (
            <div key={index} className="flex text-sm">
              <span className="text-gray-500">{label}: </span>
              <span className="ml-1 text-gray-900">{value}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function RequirementsSelector({
  title,
  description,
  value,
  onChange,
  options,
  isLoading,
  placeholder,
  onSearch,
  customSelector,
  canCreate,
  createForm,
}: RequirementsSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false);

  const selectedItems = options.filter((option) =>
    value.includes(option.value),
  );

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const removeItem = (itemValue: string) => {
    onChange(value.filter((v) => v !== itemValue));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex flex-col gap-3">
        <SheetTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2 truncate">
              {value.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="font-medium">{value.length}</span>
                  {t("items_selected")}
                </span>
              )}
            </div>
            <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </SheetTrigger>

        {selectedItems.length > 0 && (
          <div className="flex flex-col gap-2">
            {selectedItems.map((item) => (
              <SelectedItemCard
                key={item.value}
                title={item.label}
                details={item.details}
                onRemove={() => removeItem(item.value)}
              />
            ))}
          </div>
        )}
      </div>

      <SheetContent
        side="right"
        className="flex h-full w-full flex-col p-0 md:max-w-[400px]"
      >
        <div className="flex flex-col border-b p-4">
          <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
          {description && (
            <SheetDescription className="mt-1.5 text-sm">
              {description}
            </SheetDescription>
          )}
          {canCreate && (
            <div className="mt-4">
              <Sheet
                open={isCreateSheetOpen}
                onOpenChange={setIsCreateSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setIsCreateSheetOpen(true)}
                  >
                    <Plus className="size-4" />
                    {t("create_new")}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="flex h-full w-full flex-col overflow-y-auto md:max-w-[600px] lg:max-w-[800px]"
                >
                  <div className="flex-1 overflow-y-auto py-6">
                    {createForm}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
        {customSelector ? (
          customSelector
        ) : (
          <Command className="overflow-hidden rounded-none border-none">
            <CommandInput
              placeholder={t("search")}
              onValueChange={onSearch}
              className="border-0"
            />
            <CommandEmpty className="py-6 text-center text-sm">
              {t("no_results")}
            </CommandEmpty>
            <CommandGroup className="overflow-hidden p-0">
              <ScrollArea className="h-[calc(100vh-300px)]">
                {isLoading ? (
                  <div className="p-4">
                    <TableSkeleton count={5} />
                  </div>
                ) : (
                  <div className="p-2">
                    {options.map((option) => {
                      const isSelected = value.includes(option.value);
                      return (
                        <CommandItem
                          key={option.value}
                          onSelect={() => toggleOption(option.value)}
                          className="mx-2 flex cursor-pointer items-center gap-2 rounded-md px-2"
                        >
                          <div
                            className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded-sm border border-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50",
                            )}
                          >
                            {isSelected && <Check className="size-3" />}
                          </div>
                          <span>{option.label}</span>
                        </CommandItem>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CommandGroup>
          </Command>
        )}
      </SheetContent>
    </Sheet>
  );
}
