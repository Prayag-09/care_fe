import {
  Loader2,
  MessageCircle,
  MessageSquare,
  MessageSquarePlus,
  Plus,
  Send,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

import { cn } from "@/lib/utils";

import { AutoExpandingTextarea } from "@/components/ui/auto-expanding-textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { TooltipComponent } from "@/components/ui/tooltip";

import Loading from "@/components/Common/Loading";
import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import { MessageItem } from "@/components/Notes/MessageItem";
import { MobileNav } from "@/components/Notes/MobileNav";
import { NewThreadDialog } from "@/components/Notes/NewThreadDialog";
import { ThreadItem } from "@/components/Notes/ThreadItem";
import { useMessages } from "@/components/Notes/hooks/useMessages";
import { useThreads } from "@/components/Notes/hooks/useThreads";

import { useIsMobile } from "@/hooks/use-mobile";

import { isTouchDevice } from "@/Utils/utils";

interface NoteManagerProps {
  canAccess: boolean;
  canWrite: boolean;
  encounterId?: string;
  patientId: string;
  hideEncounterNotes?: boolean;
}

export function NoteManager({
  canAccess,
  canWrite,
  encounterId,
  patientId,
  hideEncounterNotes = false,
}: NoteManagerProps) {
  const { t } = useTranslation();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [isThreadsExpanded, setIsThreadsExpanded] = useState(false);
  const [showNewThreadDialog, setShowNewThreadDialog] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recentMessageRef = useRef<HTMLDivElement | null>(null);
  const { ref, inView } = useInView();
  const [commentAdded, setCommentAdded] = useState(false);
  const isMobile = useIsMobile();

  const { threadsData, threadsLoading, unusedTemplates } = useThreads({
    patientId,
    encounterId,
    hideEncounterNotes,
    canAccess,
  });

  const {
    messagesData,
    messagesLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    createThreadMutation,
    createMessageMutation,
  } = useMessages({
    patientId,
    encounterId,
    selectedThread,
    canAccess,
    onThreadCreated: (threadId) => {
      setShowNewThreadDialog(false);
      setSelectedThread(threadId);
    },
    onMessageCreated: () => {
      setNewMessage("");
      setCommentAdded(true);
    },
  });

  useEffect(() => {
    setSelectedThread(null);
  }, [encounterId]);

  useEffect(() => {
    if (threadsData?.results.length && !selectedThread) {
      setSelectedThread(threadsData.results[0].id);
    }
  }, [threadsData, selectedThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, [messagesLoading]);

  useEffect(() => {
    if (inView && hasNextPage) {
      setCommentAdded(false);
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  useEffect(() => {
    recentMessageRef.current?.scrollIntoView({ block: "start" });
  }, [messagesData]);

  const handleCreateThread = useCallback(
    (title: string) => {
      if (!title.trim()) return;

      createThreadMutation.mutate({
        title: title.trim(),
        encounter: encounterId,
      });
    },
    [createThreadMutation, encounterId],
  );

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (
        newMessage.trim() &&
        selectedThread &&
        !createMessageMutation.isPending
      ) {
        createMessageMutation.mutate({ message: newMessage.trim() });
      }
    },
    [newMessage, selectedThread, createMessageMutation],
  );

  const recentMessage = useMemo(() => {
    if (commentAdded) return messagesData?.pages[0]?.results[0];
    return messagesData?.pages[messagesData.pages.length - 1]?.results[0];
  }, [messagesData, commentAdded]);

  const messages = useMemo(
    () => messagesData?.pages.flatMap((page) => page.results) ?? [],
    [messagesData],
  );

  const totalMessages = messagesData?.pages[0]?.count ?? 0;

  const participantsCount = useMemo(
    () => new Set(messages.map((m) => m.created_by.id)).size,
    [messages],
  );

  if (threadsLoading) {
    return <Loading />;
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] overflow-hidden lg:h-[calc(100vh-13rem)]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-4 text-primary" />
              <h3 className="text-sm font-medium">{t("notes__discussions")}</h3>
            </div>
            {canWrite && (
              <Button
                data-cy="new-thread-button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewThreadDialog(true)}
                className="h-8"
              >
                <Plus className="size-4" />
                {t("notes__new")}
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {threadsData?.results.length === 0 ? (
              <div className="text-center py-6">
                <MessageSquarePlus className="size-8 text-primary mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  {t("notes__no_discussions")}
                </p>
              </div>
            ) : (
              threadsData?.results.map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isSelected={selectedThread === thread.id}
                  onClick={() => setSelectedThread(thread.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={isThreadsExpanded} onOpenChange={setIsThreadsExpanded}>
        <SheetContent side="left" className="w-[100%] sm:w-[380px] p-0">
          <SheetDescription className="sr-only">
            {t("notes__all_discussions_description")}
          </SheetDescription>
          <SheetTitle className="sr-only">{t("encounter")}</SheetTitle>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-4 text-primary" />
                  <h3 className="text-sm font-medium">
                    {t("notes__all_discussions")}
                  </h3>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-2 p-4">
                {threadsData?.results.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageSquarePlus className="size-8 text-primary mx-auto mb-3" />
                    <p className="text-sm text-gray-500">
                      {t("notes__no_discussions")}
                    </p>
                  </div>
                ) : (
                  threadsData?.results.map((thread) => (
                    <ThreadItem
                      key={thread.id}
                      thread={thread}
                      isSelected={selectedThread === thread.id}
                      onClick={() => {
                        setSelectedThread(thread.id);
                        setIsThreadsExpanded(false);
                      }}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex flex-col h-full relative">
          {/* Header */}
          <div className="p-3 sm:p-4 border-b border-gray-200 bg-white z-1">
            {selectedThread ? (
              <div className="flex items-center gap-3">
                <h2 className="text-base font-medium truncate flex-1">
                  {
                    threadsData?.results.find((t) => t.id === selectedThread)
                      ?.title
                  }
                </h2>
                <TooltipComponent
                  content={`${t("participants")}: ${participantsCount}, ${t("messages")}: ${totalMessages}`}
                >
                  <div className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                    <Users className="size-4" />
                    <span>{participantsCount}</span>
                    <MessageSquare className="size-4 ml-3" />
                    <span>{totalMessages}</span>
                  </div>
                </TooltipComponent>
              </div>
            ) : (
              <div className="text-center text-sm font-medium text-gray-500">
                {t("notes__select_create_thread")}
              </div>
            )}
          </div>
          {selectedThread ? (
            <>
              {messagesLoading ? (
                <div className="flex-1 p-4">
                  <div className="space-y-4">
                    <CardListSkeleton count={4} />
                  </div>
                </div>
              ) : (
                <>
                  {/* Messages List */}
                  {isMobile ? (
                    <div className="flex-1 overflow-y-auto overscroll-y-contain -mx-2 px-2">
                      <div
                        className="flex flex-col-reverse py-2 min-h-full"
                        data-cy="chat-messages"
                      >
                        {messages.map((message, i) => (
                          <MessageItem
                            key={message.id}
                            message={message}
                            ref={
                              message.id === recentMessage?.id
                                ? recentMessageRef
                                : undefined
                            }
                            className={cn(i === 0 && "mb-14")}
                          />
                        ))}
                        {isFetchingNextPage && (
                          <div className="py-2">
                            <div className="space-y-4">
                              <CardListSkeleton count={3} />
                            </div>
                          </div>
                        )}
                        <div ref={ref} />
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="flex-1 px-4 h-[calc(100vh-16rem)] overflow-y-auto">
                      <div
                        className="flex flex-col-reverse py-4 min-h-full"
                        data-cy="chat-messages"
                      >
                        {messages.map((message, i) => (
                          <MessageItem
                            key={message.id}
                            message={message}
                            ref={
                              message.id === recentMessage?.id
                                ? recentMessageRef
                                : undefined
                            }
                            className={cn(i === 0 && "mb-14")}
                          />
                        ))}
                        {isFetchingNextPage && (
                          <div className="py-2">
                            <div className="space-y-4">
                              <CardListSkeleton count={3} />
                            </div>
                          </div>
                        )}
                        <div ref={ref} />
                      </div>
                    </ScrollArea>
                  )}

                  {/* Message Input */}
                  {canWrite && (
                    <div className="border-t border-gray-200 p-3 sm:p-4 bg-white sticky bottom-0 max-lg:bottom-14">
                      <form onSubmit={handleSendMessage}>
                        <div className="flex gap-2">
                          <AutoExpandingTextarea
                            data-cy="encounter-notes-chat-message-input"
                            placeholder={t("notes__type_message")}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (isTouchDevice) return;
                              if (e.key === "Enter" && e.shiftKey) {
                                handleSendMessage(e);
                              }
                            }}
                            className="flex-1 min-h-10 max-h-[50vh]"
                          />
                          <Button
                            data-cy="send-chat-message-button"
                            type="submit"
                            size="icon"
                            disabled={
                              !newMessage.trim() ||
                              createMessageMutation.isPending
                            }
                            className="size-10 shrink-0"
                          >
                            {createMessageMutation.isPending ? (
                              <Loader2 className="size-5 animate-spin" />
                            ) : (
                              <Send className="size-5" />
                            )}
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <MessageSquarePlus className="size-12 text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t("notes__welcome")}
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm">
                {t("notes__welcome_description")}
              </p>
              <Button
                onClick={() => setShowNewThreadDialog(true)}
                className="shadow-lg"
                disabled={!canWrite}
              >
                <MessageSquarePlus className="size-5 mr-2" />
                {t("notes__start_new_discussion")}
              </Button>
            </div>
          )}
        </div>
      </div>

      <MobileNav
        threadsCount={threadsData?.results.length || 0}
        onOpenThreads={() => setIsThreadsExpanded(true)}
        onNewThread={() => setShowNewThreadDialog(true)}
        canWrite={canWrite}
      />

      <NewThreadDialog
        isOpen={showNewThreadDialog}
        onClose={() => setShowNewThreadDialog(false)}
        onCreate={handleCreateThread}
        isCreating={createThreadMutation.isPending}
        threadsUnused={unusedTemplates}
      />
    </div>
  );
}
