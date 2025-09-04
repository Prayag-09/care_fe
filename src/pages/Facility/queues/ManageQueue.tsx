import BackButton from "@/components/Common/BackButton";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { NavTabs } from "@/components/ui/nav-tabs";
import { ManageQueueOngoingTab } from "@/pages/Facility/queues/ManageQueueOngoingTab";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";
import tokenSubQueueApi from "@/types/tokens/tokenSubQueue/tokenSubQueueApi";
import query from "@/Utils/request/query";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "raviger";
import { useTranslation } from "react-i18next";

interface ManageQueuePageProps {
  facilityId: string;
  resourceType: SchedulableResourceType;
  resourceId: string;
  queueId: string;
  tab: "ongoing" | "completed";
}

export function ManageQueuePage({
  facilityId,
  queueId,
  resourceType,
  resourceId,
  tab,
}: ManageQueuePageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: queue, isLoading: isQueueLoading } = useQuery({
    queryKey: ["queue", facilityId, queueId],
    queryFn: query(tokenQueueApi.get, {
      pathParams: { facility_id: facilityId, id: queueId },
    }),
  });

  // TODO: consider caching selected/activated service points to persistent storage
  const { data: subQueues, isLoading: isSubQueuesLoading } = useQuery({
    queryKey: ["servicePoints", facilityId],
    queryFn: query(tokenSubQueueApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        resource_type: resourceType,
        resource_id: resourceId,
        limit: 100, // We are assuming that a resource will not have more than 100 sub-queues
      },
    }),
  });

  if (isQueueLoading || !queue || isSubQueuesLoading || !subQueues) {
    // TODO: build appropriate loading skeleton...
    return <Loading />;
  }

  return (
    <Page title={queue.name} hideTitleOnPage>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between">
          <div className="flex gap-3 items-center">
            <BackButton size="icon">
              <ChevronLeft />
            </BackButton>
            <h4 className="text-xl font-semibold">{queue.name}</h4>
          </div>
          <div className="flex gap-3"></div>
        </div>
        <NavTabs
          tabs={{
            ongoing: {
              label: t("ongoing"),
              component: (
                <ManageQueueOngoingTab
                  facilityId={facilityId}
                  queueId={queueId}
                  subQueues={subQueues.results} // TODO: switch this to active subQueues
                />
              ),
            },
            completed: {
              label: t("finished"),
              component: <div>Completed</div>,
            },
          }}
          currentTab={tab}
          onTabChange={(tab) => navigate(tab)}
        />
      </div>
    </Page>
  );
}
