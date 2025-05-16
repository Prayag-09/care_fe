import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

import FacilityOrganizationFormSheet from "./components/AdminOrganizationFormSheet";

interface Props {
  id?: string;
  organizationType: string;
}

function OrganizationCard({
  org,
  organizationType,
  parentId,
}: {
  org: Organization;
  organizationType: string;
  parentId?: string;
}) {
  const { t } = useTranslation();

  return (
    <Card key={org.id}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap">
            <div className="space-y-1 mb-2">
              <h3 className="text-lg font-semibold">{org.name}</h3>
              <div className="flex items-center gap-2 capitalize">
                <Badge
                  variant="primary"
                  className=" border border-transparent text-indigo-800 bg-indigo-100 px-2 py-1"
                >
                  {org.org_type}
                </Badge>
              </div>
            </div>
            <div className="flex flex-row gap-2">
              <FacilityOrganizationFormSheet
                organizationType={organizationType}
                parentId={parentId}
                org={org}
              />

              <Button
                variant="white"
                size="sm"
                className="font-semibold"
                asChild
              >
                <Link
                  href={`/admin/organizations/${organizationType}/${org.id}`}
                >
                  {t("see_details")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminOrganizationView({ id, organizationType }: Props) {
  const { t } = useTranslation();
  const { qParams, Pagination, resultsPerPage, updateQuery } = useFilters({
    limit: 12,
    disableCache: true,
  });

  const { data: children, isLoading } = useQuery({
    queryKey: ["organization", "list", organizationType, id],
    queryFn: query.debounced(organizationApi.list, {
      pathParams: { id: id },
      queryParams: {
        parent: id || "",
        org_type: organizationType,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        limit: resultsPerPage,
        name: qParams.search || undefined,
      },
    }),
  });

  return (
    <div className="space-y-6 mx-auto max-w-4xl md:pt-3">
      <div className="flex flex-col lg:flex-row justify-between item-start lg:items-center  gap-4">
        <div className="flex flex-col items-start md:flex-row sm:items-center gap-4 w-full lg:justify-between">
          <div className="w-full lg:w-1/3 relative">
            <div className="relative">
              <CareIcon
                icon="l-search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-4"
              />
              <Input
                placeholder={t("search_by_department_team_name")}
                value={qParams.search || ""}
                onChange={(e) => {
                  updateQuery({ search: e.target.value || undefined });
                }}
                className="w-full pl-8"
              />
            </div>
          </div>
          <div className="w-auto">
            {
              <FacilityOrganizationFormSheet
                organizationType={organizationType}
                parentId={id}
              />
            }
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1  gap-3">
          <CardListSkeleton count={4} />
        </div>
      ) : (
        <div className="space-y-6 md:pb-6">
          <div className="space-y-4">
            {children?.results?.length ? (
              children.results.map((org) => (
                <OrganizationCard
                  key={org.id}
                  org={org}
                  organizationType={organizationType}
                  parentId={id}
                />
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center text-gray-500">
                  {t("no_organizations_found")}
                </CardContent>
              </Card>
            )}
          </div>
          {children && children.count > resultsPerPage && (
            <div className="flex justify-center">
              <Pagination totalCount={children.count} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
