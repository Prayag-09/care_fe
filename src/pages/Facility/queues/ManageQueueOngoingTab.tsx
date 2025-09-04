import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenRead, TokenStatus } from "@/types/tokens/token/token";
import tokenApi from "@/types/tokens/token/tokenApi";
import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";
import { TokenSubQueueRead } from "@/types/tokens/tokenSubQueue/tokenSubQueue";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatPatientAge } from "@/Utils/utils";
import { DotsHorizontalIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { DoorOpenIcon, Megaphone } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  facilityId: string;
  queueId: string;
  subQueues: TokenSubQueueRead[];
}

export function ManageQueueOngoingTab({
  facilityId,
  queueId,
  subQueues,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex space-x-4 overflow-x-auto w-full">
        <WaitingTokensColumn facilityId={facilityId} queueId={queueId} />
        <InServiceTokensColumn
          facilityId={facilityId}
          queueId={queueId}
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
  const { data } = useQuery({
    queryKey: [
      "tokens",
      facilityId,
      queueId,
      { sub_queue: subQueue.id, status },
    ],
    queryFn: query(tokenApi.list, {
      pathParams: { facility_id: facilityId, queue_id: queueId },
      queryParams: {
        sub_queue: subQueue.id,
        status,
      },
    }),
  });

  return (
    <div className="flex flex-col p-1 rounded-lg bg-gray-200">
      <div className="p-1">
        <span className="text-sm font-medium">{subQueue.name}</span>
      </div>
      <div className="flex flex-col gap-3">
        {data ? (
          data.results.length > 0 ? (
            data.results.map((token) => (
              <TokenCard key={token.id} token={token} />
            ))
          ) : (
            emptyState
          )
        ) : (
          <TokenCardSkeleton count={2} />
        )}
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
  const { t } = useTranslation();

  const { data } = useQuery({
    queryKey: ["tokens", facilityId, queueId, { status: TokenStatus.CREATED }],
    queryFn: query(tokenApi.list, {
      pathParams: { facility_id: facilityId, queue_id: queueId },
      queryParams: {
        status: TokenStatus.CREATED,
      },
    }),
  });

  return (
    <QueueColumn
      title={t("waiting")}
      count={
        <Badge size="sm" variant="blue">
          {data?.count}
        </Badge>
      }
    >
      <div className="flex flex-col gap-4">
        {data ? (
          data.results.map((token) => (
            <TokenCard key={token.id} token={token} />
          ))
        ) : (
          <TokenCardSkeleton count={5} />
        )}
      </div>
    </QueueColumn>
  );
}

function InServiceTokensColumn({
  facilityId,
  queueId,
  subQueues,
}: {
  facilityId: string;
  queueId: string;
  subQueues: TokenSubQueueRead[];
}) {
  const { t } = useTranslation();

  const {
    mutate: setNextTokenToSubQueue,
    isPending: isSettingNextTokenToSubQueue,
  } = useMutation({
    mutationFn: mutate(tokenQueueApi.setNextTokenToSubQueue, {
      pathParams: { facility_id: facilityId, id: queueId },
    }),
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
                <Button
                  variant="outline"
                  size="lg"
                  disabled={isSettingNextTokenToSubQueue}
                  onClick={() =>
                    setNextTokenToSubQueue({ sub_queue: subQueue.id })
                  }
                >
                  <Megaphone />
                  {t("call_next_patient")}
                </Button>
              </div>
            }
          />
        ))}
      </div>
    </QueueColumn>
  );
}

function TokenCard({ token }: { token: TokenRead | null }) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-3 items-center justify-between p-3 bg-white rounded-lg shadow">
      <div className="flex flex-col">
        {token ? (
          <span className="font-semibold">{token.patient.name}</span>
        ) : (
          <Skeleton className="h-4 w-36 my-2" />
        )}
        {token ? (
          <span className="text-sm text-gray-700">
            {formatPatientAge(token.patient, true)},{" "}
            {t(`GENDER__${token.patient.gender}`)}
          </span>
        ) : (
          <Skeleton className="h-4 w-24" />
        )}
        {/* <div className="flex items-center gap-1.5"></div> */}
        {/* TODO: do we show tags here? or something else? */}
      </div>
      <div className="flex items-center gap-3">
        {token ? (
          <div className="min-h-14 p-2 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold">
              {token.category.shorthand}-
              {token.number.toString().padStart(3, "0")}
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
