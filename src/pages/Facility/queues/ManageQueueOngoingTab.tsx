import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectActionButton } from "@/components/ui/select-action-button";
import { Skeleton } from "@/components/ui/skeleton";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import {
  renderTokenNumber,
  TokenRead,
  TokenStatus,
} from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import tokenCategoryApi from "@/types/tokens/tokenCategory/tokenCategoryApi";
import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";
import { TokenSubQueueRead } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { DoorOpenIcon, Megaphone } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

interface Props {
  facilityId: string;
  queueId: string;
  resourceType: SchedulableResourceType;
  resourceId: string;
  subQueues: TokenSubQueueRead[];
}

export function ManageQueueOngoingTab({
  facilityId,
  queueId,
  subQueues,
  resourceType,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex space-x-4 overflow-x-auto w-full">
        <WaitingTokensColumn facilityId={facilityId} queueId={queueId} />
        <InServiceTokensColumn
          facilityId={facilityId}
          queueId={queueId}
          resourceType={resourceType}
          subQueues={subQueues}
        />
      </div>
    </div>
  );
}

function QueueColumn({
  title,
  count,
  children,
}: {
  title: React.ReactNode;
  count: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-3 rounded-lg bg-gray-100 border border-gray-200 min-w-xs flex-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">{title}</span>
          {count}
        </div>
      </div>
      <div className="h-[calc(100vh-15rem)] overflow-y-auto pb-2">
        {children}
      </div>
    </div>
  );
}

const PAGE_SIZE = 50;

function SubQueueColumn({
  facilityId,
  queueId,
  subQueue,
  status,
  emptyState,
}: {
  facilityId: string;
  queueId: string;
  subQueue: TokenSubQueueRead;
  status: TokenStatus;
  emptyState: React.ReactNode;
}) {
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [
        "infinite-tokens",
        facilityId,
        queueId,
        { sub_queue: subQueue.id, status },
      ],
      queryFn: async ({ pageParam = 0, signal }) => {
        const response = await query(tokenApi.list, {
          pathParams: { facility_id: facilityId, queue_id: queueId },
          queryParams: {
            sub_queue: subQueue.id,
            status,
            limit: PAGE_SIZE,
            offset: pageParam,
          },
        })({ signal });
        return response;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const currentOffset = allPages.length * PAGE_SIZE;
        return currentOffset < lastPage.count ? currentOffset : null;
      },
    });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const tokens = data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <div className="flex flex-col p-1 rounded-lg bg-gray-200">
      <div className="p-1">
        <span className="text-sm font-medium">{subQueue.name}</span>
      </div>
      <div className="flex flex-col gap-3">
        {tokens.length > 0
          ? tokens.map((token, index) => (
              <div
                key={token.id}
                ref={index === tokens.length - 1 ? ref : undefined}
              >
                <TokenCard token={token} />
              </div>
            ))
          : emptyState}
        {isFetchingNextPage && <TokenCardSkeleton count={5} />}
      </div>
    </div>
  );
}

function WaitingTokensColumn({
  facilityId,
  queueId,
}: {
  facilityId: string;
  queueId: string;
}) {
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: [
        "infinite-tokens",
        facilityId,
        queueId,
        { status: TokenStatus.CREATED },
      ],
      queryFn: async ({ pageParam = 0, signal }) => {
        const response = await query(tokenApi.list, {
          pathParams: { facility_id: facilityId, queue_id: queueId },
          queryParams: {
            status: TokenStatus.CREATED,
            limit: PAGE_SIZE,
            offset: pageParam,
          },
        })({ signal });
        return response;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const currentOffset = allPages.length * PAGE_SIZE;
        return currentOffset < lastPage.count ? currentOffset : null;
      },
    });

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  const tokens = data?.pages.flatMap((page) => page.results) ?? [];
  const { t } = useTranslation();
  return (
    <QueueColumn
      title={t("waiting")}
      count={
        <Badge size="sm" variant="blue">
          {data?.pages[0]?.count ?? 0}
        </Badge>
      }
    >
      <div className="flex flex-col gap-4">
        {tokens.length > 0 ? (
          tokens.map((token, index) => (
            <div
              key={token.id}
              ref={index === tokens.length - 1 ? ref : undefined}
            >
              <TokenCard token={token} />
            </div>
          ))
        ) : (
          <TokenCardSkeleton count={5} />
        )}
        {isFetchingNextPage && <TokenCardSkeleton count={5} />}
      </div>
    </QueueColumn>
  );
}
function InServiceTokensColumn({
  facilityId,
  queueId,
  resourceType,
  subQueues,
}: {
  facilityId: string;
  queueId: string;
  resourceType: SchedulableResourceType;
  subQueues: TokenSubQueueRead[];
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: tokenCategories } = useQuery({
    queryKey: ["tokenCategories", facilityId, resourceType],
    queryFn: query(tokenCategoryApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: {
        resource_type: resourceType,
      },
    }),
  });

  const {
    mutate: setNextTokenToSubQueue,
    isPending: isSettingNextTokenToSubQueue,
  } = useMutation({
    mutationFn: mutate(tokenQueueApi.setNextTokenToSubQueue, {
      pathParams: { facility_id: facilityId, id: queueId },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "infinite-tokens",
          facilityId,
          queueId,
          { status: TokenStatus.IN_PROGRESS },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "infinite-tokens",
          facilityId,
          queueId,
          { status: TokenStatus.CREATED },
        ],
      });
    },
  });

  return (
    <QueueColumn
      title={t("in_service")}
      count={
        <Badge size="sm" variant="green">
          {/* {data.count} */}111
        </Badge>
      }
    >
      <div className="flex flex-col gap-4">
        {subQueues.map((subQueue) => (
          <SubQueueColumn
            key={subQueue.id}
            subQueue={subQueue}
            facilityId={facilityId}
            queueId={queueId}
            status={TokenStatus.IN_PROGRESS}
            emptyState={
              <div className="flex flex-col gap-2 items-center justify-center bg-gray-100 rounded-lg py-3 border border-gray-100">
                <DoorOpenIcon className="size-6 text-gray-700" />
                <span className="text-sm font-semibold text-gray-700">
                  {t("no_patient_is_being_called")}
                </span>
                {tokenCategories && (
                  <SelectActionButton
                    options={[
                      {
                        value: null,
                        label: t("call_next_patient"),
                        icon: Megaphone,
                      },
                      ...tokenCategories.results.map((category) => ({
                        value: category.id,
                        label: `${t("call_next_patient")} (${category.name})`,
                        icon: Megaphone,
                      })),
                    ]}
                    onAction={(categoryId) =>
                      setNextTokenToSubQueue({
                        sub_queue: subQueue.id,
                        category: categoryId ?? undefined,
                      })
                    }
                    persistKey={`call-next-patient-pref-category-${subQueue.id}`}
                    disabled={isSettingNextTokenToSubQueue}
                    loading={isSettingNextTokenToSubQueue}
                    variant="outline"
                    size="lg"
                  />
                )}
              </div>
            }
          />
        ))}
      </div>
    </QueueColumn>
  );
}

function TokenCard({ token }: { token: TokenRead | null }) {
  return (
    <div className="flex gap-3 items-center justify-between p-3 bg-white rounded-lg shadow">
      <div className="flex flex-col">
        {token ? (
          <span className="font-semibold">
            {token.patient ? token.patient.name : renderTokenNumber(token)}
          </span>
        ) : (
          <Skeleton className="h-4 w-36 my-2" />
        )}
      </div>
      <div className="flex items-center gap-3">
        {token ? (
          <div className="min-h-14 p-2 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold">
              {renderTokenNumber(token)}
            </span>
          </div>
        ) : (
          <Skeleton className="h-12 w-20" />
        )}
        <Button variant="ghost" size="icon" disabled={!token}>
          <DotsHorizontalIcon />
        </Button>
      </div>
    </div>
  );
}

function TokenCardSkeleton({ count = 5 }: { count?: number }) {
  return Array.from({ length: count }, (_, index) => (
    <TokenCard key={index} token={null} />
  ));
}
