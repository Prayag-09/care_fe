import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Hash, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import encounterApi from "@/types/emr/encounter/encounterApi";
import patientApi from "@/types/emr/patient/patientApi";

// Define the entity types that support tags
export type TagEntityType = "patient" | "encounter";

// Configuration for different entity types using their respective API files
// TODO: Add more entity configurations here as needed
const ENTITY_CONFIG = {
  patient: {
    setTagsApi: patientApi.setTags,
    removeTagsApi: patientApi.removeTags,
    displayName: "patient",
  },
  encounter: {
    setTagsApi: encounterApi.setTags,
    removeTagsApi: encounterApi.removeTags,
    displayName: "encounter",
  },
  // TODO: Add more entity configurations here
  // service_request: {
  //   setTagsApi: serviceRequestApi.setTags,
  //   removeTagsApi: serviceRequestApi.removeTags,
  //   displayName: "service_request",
  // },
  // charge_item: {
  //   setTagsApi: chargeItemApi.setTags,
  //   removeTagsApi: chargeItemApi.removeTags,
  //   displayName: "charge_item",
  // },
  // activity_definition: {
  //   setTagsApi: activityDefinitionApi.setTags,
  //   removeTagsApi: activityDefinitionApi.removeTags,
  //   displayName: "activity_definition",
  // },
} as const;

// Tag interface
interface Tag {
  id: string;
  slug: string;
  display: string;
  category: string;
  description?: string;
}

interface TagAssignmentSheetProps {
  entityType: TagEntityType;
  entityId: string;
  currentTags: Tag[];
  onUpdate: () => void;
  trigger?: React.ReactNode;
  canWrite?: boolean;
}

interface TagSelectorProps {
  title?: string;
  selected: Tag[];
  onToggle: (tagId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLoading?: boolean;
  tagOptions?: Tag[];
  className?: string;
  triggerClassName?: string;
}

export function TagSelectorPopover({
  title,
  selected,
  onToggle,
  searchQuery,
  onSearchChange,
  isLoading,
  tagOptions,
  className,
  triggerClassName,
}: TagSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Popover
      modal={true}
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onSearchChange("");
        }
        setOpen(isOpen);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            triggerClassName,
          )}
        >
          <Hash className="mr-2 size-4" />
          <span>{title || t("search_tags")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("p-0 w-[var(--radix-popover-trigger-width)]", className)}
        align="start"
      >
        <Command className="rounded-lg" filter={() => 1}>
          <CommandInput
            placeholder={t("search_tags")}
            value={searchQuery}
            onValueChange={onSearchChange}
            className="outline-hidden border-none ring-0 shadow-none"
          />
          <CommandList>
            <CommandEmpty>{t("no_tags_found")}</CommandEmpty>
            <CommandGroup>
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              ) : (
                tagOptions?.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.id}
                    onSelect={() => onToggle(tag.id)}
                  >
                    <div className="flex flex-1 items-center gap-2">
                      <Hash className="size-4" />
                      <span>{tag.display}</span>
                      <Badge variant="outline" className="text-xs">
                        {tag.category}
                      </Badge>
                    </div>
                    {selected.some((t) => t.id === tag.id) && (
                      <Check className="size-4" />
                    )}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function TagAssignmentSheet({
  entityType,
  entityId,
  currentTags,
  onUpdate,
  trigger,
  canWrite = true,
}: TagAssignmentSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  const entityConfig = ENTITY_CONFIG[entityType];

  // Fetch available tags (all tags in the system)
  const { data: availableTags, isLoading } = useQuery({
    queryKey: ["available_tags", searchQuery],
    queryFn: query.debounced(
      {
        path: "/api/v1/tag_config/",
        method: "GET",
        TRes: {} as any,
      },
      {
        queryParams: searchQuery !== "" ? { search: searchQuery } : undefined,
      },
    ),
  });

  // Set tags mutation
  const { mutate: setTags, isPending: isSettingTags } = useMutation({
    mutationFn: mutate(entityConfig.setTagsApi, {
      pathParams: { external_id: entityId },
    }),
    onSuccess: () => {
      onUpdate();
      toast.success(t("tags_updated_successfully"));
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || t("failed_to_update_tags"));
    },
  });

  // Remove tags mutation
  const { mutate: removeTags, isPending: isRemovingTags } = useMutation({
    mutationFn: mutate(entityConfig.removeTagsApi, {
      pathParams: { external_id: entityId },
    }),
    onSuccess: () => {
      onUpdate();
      toast.success(t("tags_removed_successfully"));
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || t("failed_to_remove_tags"));
    },
  });

  // Initialize selected tags from current entity tags
  useEffect(() => {
    setSelectedTags(currentTags);
  }, [currentTags]);

  // Merge available tags with selected tags
  const tagOptions = useMemo(() => {
    if (!availableTags?.results) return selectedTags;
    if (searchQuery) return availableTags.results;

    const availableIds = new Set(
      availableTags.results.map((tag: Tag) => tag.id),
    );
    const selectedNotInAvailable = selectedTags.filter(
      (selectedTag: Tag) => !availableIds.has(selectedTag.id),
    );

    return [...availableTags.results, ...selectedNotInAvailable];
  }, [availableTags, selectedTags, searchQuery]);

  if (!entityConfig) {
    console.error(`Unsupported entity type: ${entityType}`);
    return null;
  }

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((current) => {
      const newTag = tagOptions?.find((tag: Tag) => tag.id === tagId);
      return current.some((tag: Tag) => tag.id === tagId)
        ? current.filter((tag: Tag) => tag.id !== tagId)
        : newTag
          ? [...current, newTag]
          : current;
    });
  };

  const handleSave = () => {
    const currentTagIds = new Set(currentTags.map((tag: Tag) => tag.id));
    const selectedTagIds = new Set(selectedTags.map((tag: Tag) => tag.id));

    // Find tags to add and remove
    const tagsToAdd = selectedTags.filter(
      (tag: Tag) => !currentTagIds.has(tag.id),
    );
    const tagsToRemove = currentTags.filter(
      (tag: Tag) => !selectedTagIds.has(tag.id),
    );

    // Execute mutations
    if (tagsToAdd.length > 0) {
      setTags({ tags: tagsToAdd.map((tag: Tag) => tag.id) });
    }
    if (tagsToRemove.length > 0) {
      removeTags({ tags: tagsToRemove.map((tag: Tag) => tag.id) });
    }
  };

  const hasChanges =
    new Set(currentTags.map((tag: Tag) => tag.id)).size !==
      new Set(selectedTags).size ||
    !currentTags.every((tag: Tag) =>
      selectedTags.some((st: Tag) => st.id === tag.id),
    );

  const isLoadingTags = isSettingTags || isRemovingTags;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" disabled={!canWrite}>
            <Hash className="mr-2 size-4" />
            {t("manage_tags")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("manage_tags")}</SheetTitle>
          <SheetDescription>
            {t("manage_tags_for_entity", {
              entity: t(entityConfig.displayName),
            })}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Selected Tags */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t("selected_tags")}</h3>
            <div className="flex flex-wrap gap-2">
              {selectedTags?.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag.display}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-4 p-0 hover:bg-transparent"
                    onClick={() => handleToggleTag(tag.id)}
                    disabled={isLoadingTags || !canWrite}
                  >
                    <X className="size-3" />
                  </Button>
                </Badge>
              ))}
              {(!selectedTags || selectedTags.length === 0) && (
                <p className="text-sm text-gray-500">{t("no_tags_selected")}</p>
              )}
            </div>
          </div>

          {/* Tag Selector */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t("add_tags")}</h3>
            <TagSelectorPopover
              selected={selectedTags}
              onToggle={handleToggleTag}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isLoading={isLoading}
              tagOptions={tagOptions}
              className="w-full justify-start text-left font-normal"
            />
          </div>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex w-full justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedTags(currentTags);
                setOpen(false);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoadingTags || !hasChanges || !canWrite}
            >
              {isLoadingTags ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("save")
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
