import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import patientApi from "@/types/emr/patient/patientApi";
import { Message } from "@/types/notes/messages";
import { Thread } from "@/types/notes/threads";

import { MESSAGES_LIMIT } from "@/src/components/Notes/constants";

interface UseMessagesProps {
  patientId: string;
  encounterId?: string;
  selectedThread: string | null;
  canAccess: boolean;
  onThreadCreated?: (threadId: string) => void;
  onMessageCreated?: () => void;
}

export function useMessages({
  patientId,
  selectedThread,
  canAccess,
  onThreadCreated,
  onMessageCreated,
}: UseMessagesProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: messagesData,
    isLoading: messagesLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedResponse<Message>>({
    queryKey: ["messages", selectedThread],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await query(patientApi.getMessages, {
        pathParams: {
          patientId,
          threadId: selectedThread!,
        },
        queryParams: {
          limit: String(MESSAGES_LIMIT),
          offset: String(pageParam),
        },
      })({ signal: new AbortController().signal });
      return response as PaginatedResponse<Message>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * MESSAGES_LIMIT;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    enabled: !!selectedThread && canAccess,
  });

  const createThreadMutation = useMutation({
    mutationFn: mutate(patientApi.createThread, {
      pathParams: { patientId },
    }),
    onSuccess: (newThread) => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      const threadId = (newThread as Thread).id;
      onThreadCreated?.(threadId);
      toast.success(t("notes__thread_created"));
    },
    onError: () => {
      toast.error(t("notes__failed_create_thread"));
    },
  });

  const createMessageMutation = useMutation({
    mutationFn: mutate(patientApi.postMessage, {
      pathParams: { patientId, threadId: selectedThread! },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedThread] });
      onMessageCreated?.();
    },
    onError: () => {
      toast.error(t("notes__failed_send_message"));
    },
  });

  return {
    messagesData,
    messagesLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    createThreadMutation,
    createMessageMutation,
  };
}
