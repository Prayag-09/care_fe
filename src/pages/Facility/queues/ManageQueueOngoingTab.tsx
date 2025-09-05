import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Check,
  DoorOpenIcon,
  Megaphone,
  MoreHorizontal,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
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
  options,
}: {
  facilityId: string;
  queueId: string;
  subQueue: TokenSubQueueRead;
  status: TokenStatus;
  emptyState: React.ReactNode;
  options?: React.ReactNode;
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
      <div className="flex items-center justify-between p-1">
        <span className="text-sm font-medium">{subQueue.name}</span>
        {options}
      </div>
      <div className="flex flex-col gap-3">
        {tokens.length > 0
          ? tokens.map((token, index) => (
              <div
                key={token.id}
                ref={index === tokens.length - 1 ? ref : undefined}
              >
                <TokenCard
                  token={token}
                  options={
                    <InServiceTokenOptions
                      token={token}
                      facilityId={facilityId}
                      queueId={queueId}
                    />
                  }
                />
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
              <TokenCard
                token={token}
                options={
                  <WaitingTokenOptions
                    token={token}
                    facilityId={facilityId}
                    queueId={queueId}
                  />
                }
              />
            </div>
          ))
        ) : (
          <div className="flex flex-col gap-2 items-center justify-center bg-gray-100 rounded-lg py-10 border border-gray-100">
            <DoorOpenIcon className="size-6 text-gray-700" />
            <span className="text-sm font-semibold text-gray-700">
              {t("no_patient_is_waiting")}
            </span>
          </div>
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
                <CallNextPatientButton
                  subQueueId={subQueue.id}
                  facilityId={facilityId}
                  queueId={queueId}
                  resourceType={resourceType}
                  variant="outline"
                  size="lg"
                />
              </div>
            }
            options={
              <CallNextPatientButton
                subQueueId={subQueue.id}
                facilityId={facilityId}
                queueId={queueId}
                resourceType={resourceType}
                variant="secondary"
                size="xs"
              />
            }
          />
        ))}
      </div>
    </QueueColumn>
  );
}

function TokenCancelConfirmDialog({
  open,
  onOpenChange,
  token,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: TokenRead;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("cancel_token")}
      description={t("cancel_token_confirmation", {
        patientName: token.patient?.name,
        tokenNumber: renderTokenNumber(token),
      })}
      onConfirm={onConfirm}
      cancelText={t("cancel")}
      confirmText={t("cancel_token")}
      variant="destructive"
      disabled={isLoading}
    />
  );
}

function TokenCompleteConfirmDialog({
  open,
  onOpenChange,
  token,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: TokenRead;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <ConfirmActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("complete_token")}
      description={t("complete_token_confirmation", {
        patientName: token.patient?.name,
        tokenNumber: `${token.category.shorthand}-${token.number.toString().padStart(3, "0")}`,
      })}
      onConfirm={onConfirm}
      cancelText={t("cancel")}
      confirmText={t("complete_token")}
      variant="primary"
      disabled={isLoading}
    />
  );
}

function WaitingTokenOptions({
  token,
  facilityId,
  queueId,
}: {
  token: TokenRead;
  facilityId: string;
  queueId: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { mutate: updateToken, isPending: isUpdating } = useMutation({
    mutationFn: mutate(tokenApi.update, {
      pathParams: {
        facility_id: facilityId,
        queue_id: queueId,
        id: token.id,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "infinite-tokens",
          facilityId,
          queueId,
          { status: TokenStatus.CREATED },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "infinite-tokens",
          facilityId,
          queueId,
          { status: TokenStatus.CANCELLED },
        ],
      });
      setShowCancelDialog(false);
    },
  });

  const handleCancelToken = () => {
    updateToken({
      status: TokenStatus.CANCELLED,
      note: token.note,
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isUpdating}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setShowCancelDialog(true)}
            disabled={isUpdating}
          >
            <X className="size-4 text-danger-500" />
            {t("cancel_token")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <TokenCancelConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        token={token}
        onConfirm={handleCancelToken}
        isLoading={isUpdating}
      />
    </>
  );
}

function InServiceTokenOptions({
  token,
  facilityId,
  queueId,
}: {
  token: TokenRead;
  facilityId: string;
  queueId: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  const { mutate: updateToken, isPending: isUpdating } = useMutation({
    mutationFn: mutate(tokenApi.update, {
      pathParams: {
        facility_id: facilityId,
        queue_id: queueId,
        id: token.id,
      },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "infinite-tokens",
          facilityId,
          queueId,
          { sub_queue: token.sub_queue?.id, status: TokenStatus.IN_PROGRESS },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "infinite-tokens",
          facilityId,
          queueId,
          { status: TokenStatus.COMPLETED },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "infinite-tokens",
          facilityId,
          queueId,
          { status: TokenStatus.CANCELLED },
        ],
      });
      setShowCancelDialog(false);
      setShowCompleteDialog(false);
    },
  });

  const handleCancelToken = () => {
    updateToken({
      status: TokenStatus.CANCELLED,
      note: token.note,
    });
  };

  const handleCompleteToken = () => {
    updateToken({
      status: TokenStatus.COMPLETED,
      note: token.note,
      sub_queue: undefined,
    });
  };

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Complete button */}
        <Button
          variant="outline_primary"
          size="icon"
          onClick={() => setShowCompleteDialog(true)}
          disabled={isUpdating}
          title={t("complete_token")}
        >
          <Check />
        </Button>

        {/* Dropdown menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            disabled={isUpdating}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setShowCancelDialog(true)}
              disabled={isUpdating}
            >
              <X className="size-4 text-danger-500" />
              {t("cancel_token")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TokenCancelConfirmDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        token={token}
        onConfirm={handleCancelToken}
        isLoading={isUpdating}
      />

      <TokenCompleteConfirmDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        token={token}
        onConfirm={handleCompleteToken}
        isLoading={isUpdating}
      />
    </>
  );
}

function TokenCard({
  token,
  options,
}: {
  token: TokenRead | null;
  options?: React.ReactNode;
}) {
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
        {/* <div className="flex items-center gap-1.5"></div> */}
        {/* TODO: do we show tags here? or something else? */}
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
        {options}
      </div>
    </div>
  );
}

function TokenCardSkeleton({ count = 5 }: { count?: number }) {
  return Array.from({ length: count }, (_, index) => (
    <TokenCard key={index} token={null} />
  ));
}

function CallNextPatientButton({
  subQueueId,
  facilityId,
  queueId,
  resourceType,
  ...props
}: {
  subQueueId: string;
  facilityId: string;
  resourceType: SchedulableResourceType;
  queueId: string;
} & Omit<
  React.ComponentProps<typeof SelectActionButton>,
  "options" | "onAction" | "persistKey"
>) {
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

  if (!tokenCategories) {
    return null;
  }

  return (
    <SelectActionButton
      {...props}
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
          sub_queue: subQueueId,
          category: categoryId ?? undefined,
        })
      }
      persistKey={`call-next-patient-pref-category-${subQueueId}`}
      disabled={isSettingNextTokenToSubQueue}
      loading={isSettingNextTokenToSubQueue}
    />
  );
}
