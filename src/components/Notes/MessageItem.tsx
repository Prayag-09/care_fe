import { formatRelative } from "date-fns";
import { Link, usePathParams } from "raviger";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

import { Markdown } from "@/components/ui/markdown";
import { TooltipComponent } from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";

import useAuthUser from "@/hooks/useAuthUser";

import { formatDateTime, formatName } from "@/Utils/utils";
import { Message } from "@/types/notes/messages";

interface MessageItemProps extends React.ComponentProps<"div"> {
  message: Message;
}

export const MessageItem = forwardRef<HTMLDivElement, MessageItemProps>(
  ({ message, className, ...props }, ref) => {
    const authUser = useAuthUser();
    const { facilityId } = usePathParams("/facility/:facilityId/*") ?? {};
    const isCurrentUser = authUser?.id === message.created_by.id;

    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full mb-4 animate-in fade-in-0 slide-in-from-bottom-4",
          isCurrentUser ? "justify-end" : "justify-start",
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            "flex max-w-[80%] items-start gap-3",
            isCurrentUser ? "flex-row-reverse" : "flex-row",
          )}
        >
          <TooltipComponent content={message.created_by?.username}>
            <Link
              href={
                facilityId
                  ? `/facility/${facilityId}/users/${message.created_by?.username}`
                  : `/users/${message.created_by?.username}`
              }
            >
              <span className="flex pr-2">
                <Avatar
                  name={formatName(message.created_by)}
                  imageUrl={message.created_by?.profile_picture_url}
                  className="size-8 rounded-full object-cover ring-1 ring-transparent hover:ring-red-200 transition"
                />
              </span>
            </Link>
          </TooltipComponent>
          <div
            className={cn(
              "p-3 rounded-lg break-words whitespace-pre-wrap w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg",
              isCurrentUser
                ? "bg-white text-black rounded-tr-none border border-gray-200"
                : "bg-gray-100 rounded-tl-none border border-gray-200",
            )}
          >
            <p className="text-xs space-x-2 mb-1">
              <span className="text-gray-700 font-medium">
                {formatName(message.created_by)}
              </span>
              <time
                className="text-gray-500"
                dateTime={message.created_date}
                title={formatDateTime(message.created_date)}
              >
                {formatRelative(message.created_date, new Date())}
              </time>
            </p>
            <div
              className={cn(
                "p-3 rounded-lg break-words",
                isCurrentUser
                  ? "bg-white text-black rounded-tr-none border border-gray-200"
                  : "bg-gray-100 rounded-tl-none border border-gray-200",
              )}
            >
              {message.message && (
                <Markdown content={message.message} className="text-sm" />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
);

MessageItem.displayName = "MessageItem";
