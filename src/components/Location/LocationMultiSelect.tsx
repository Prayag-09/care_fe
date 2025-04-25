// TODO: This is a temporary fix to the location multi select.
// This doesn't account for nested locations.
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import query from "@/Utils/request/query";
import { LocationList, LocationTypeIcons } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface LocationTreeNodeProps {
  location: LocationList;
  selectedLocationIds: string[];
  onSelect: (locationId: string) => void;
  expandedLocations: Set<string>;
  onToggleExpand: (locationId: string) => void;
  level?: number;
  facilityId: string;
  searchQuery: string;
}

function LocationTreeNode({
  location,
  selectedLocationIds,
  onSelect,
  expandedLocations,
  onToggleExpand,
  level = 0,
  facilityId,
  searchQuery,
}: LocationTreeNodeProps) {
  const isExpanded = expandedLocations.has(location.id);
  const isSelected = selectedLocationIds.includes(location.id);
  const Icon =
    LocationTypeIcons[location.form as keyof typeof LocationTypeIcons];

  // Only fetch children when expanded
  const { data: children, isLoading } = useQuery({
    queryKey: ["locations", facilityId, "children", location.id, "kind"],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: location.id,
        mode: "kind",
      },
    }),
    enabled: isExpanded,
    staleTime: 5 * 60 * 1000,
  });

  // Check if location has children by making a separate query
  const { data: hasChildrenData } = useQuery({
    queryKey: ["locations", facilityId, "has-children", location.id],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        parent: location.id,
        mode: "kind",
        limit: 1,
      },
    }),
    enabled: !isExpanded && !children,
    staleTime: 5 * 60 * 1000,
  });

  const hasChildren = isExpanded
    ? children?.results && children.results.length > 0
    : hasChildrenData?.results && hasChildrenData.results.length > 0;

  // Filter children based on search query
  const filteredChildren = children?.results.filter((child) =>
    child.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Check if this location or any of its children match the search query
  const locationMatches = location.name
    .toLowerCase()
    .includes(searchQuery.toLowerCase());
  const hasMatchingChildren = filteredChildren && filteredChildren.length > 0;

  // If there's a search query and neither this location nor its children match, don't render
  if (searchQuery && !locationMatches && !hasMatchingChildren) {
    return null;
  }

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100",
        )}
        style={{ paddingLeft: `${level}rem` }}
      >
        {isLoading ? (
          <Button variant="ghost" size="icon" className="size-6">
            <div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          </Button>
        ) : hasChildren ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(location.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
        ) : (
          <span className="w-6" />
        )}
        <div
          className="flex items-center flex-1 text-sm gap-2 w-0"
          onClick={() => onSelect(location.id)}
        >
          <div
            className={cn(
              "flex size-4 shrink-0 items-center justify-center rounded-sm border border-primary",
              isSelected ? "bg-primary text-primary-foreground" : "opacity-50",
            )}
          >
            {isSelected && <Check className="size-3" />}
          </div>
          <Icon className="size-4" />
          <span className="truncate">{location.name}</span>
        </div>
      </div>
      {isExpanded && filteredChildren && filteredChildren.length > 0 && (
        <div className="pl-2">
          {filteredChildren.map((child) => (
            <LocationTreeNode
              key={child.id}
              location={child}
              selectedLocationIds={selectedLocationIds}
              onSelect={onSelect}
              expandedLocations={expandedLocations}
              onToggleExpand={onToggleExpand}
              level={level}
              facilityId={facilityId}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(
    new Set(),
  );
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allLocations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ["locations", facilityId, "mine", "kind"],
    queryFn: query.paginated(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        mine: true,
        mode: "kind",
      },
      pageSize: 100,
    }),
  });

  // Filter to get only top-level locations (no parent)
  const topLevelLocations =
    allLocations?.results?.filter(
      (location) =>
        !location.parent || Object.keys(location.parent).length === 0,
    ) || [];

  const handleToggleExpand = (locationId: string) => {
    setExpandedLocations((prev) => {
      const next = new Set(prev);
      if (next.has(locationId)) {
        next.delete(locationId);
      } else {
        next.add(locationId);
      }
      return next;
    });
  };

  const handleSelect = (locationId: string) => {
    onChange(
      value.includes(locationId)
        ? value.filter((id) => id !== locationId)
        : [...value, locationId],
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full px-3">
        <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={t("search_locations")}
          className="w-full rounded-md border border-input bg-background pl-8 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <ScrollArea className="h-[300px]">
        <div className="p-2">
          {isLoadingLocations ? (
            <div className="p-4">
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-8 w-full animate-pulse rounded-md bg-gray-200"
                  />
                ))}
              </div>
            </div>
          ) : topLevelLocations.length > 0 ? (
            <>
              {topLevelLocations.map((location) => (
                <LocationTreeNode
                  key={location.id}
                  location={location}
                  selectedLocationIds={value}
                  onSelect={handleSelect}
                  expandedLocations={expandedLocations}
                  onToggleExpand={handleToggleExpand}
                  facilityId={facilityId}
                  searchQuery={searchQuery}
                />
              ))}
            </>
          ) : (
            <div className="p-4 text-sm text-gray-500">
              {t("no_locations_available")}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
