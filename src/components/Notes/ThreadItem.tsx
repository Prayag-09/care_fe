import { cn } from "@/lib/utils";

import { Thread } from "@/types/notes/threads";

interface ThreadItemProps {
  thread: Thread;
  isSelected: boolean;
  onClick: () => void;
}

export function ThreadItem({ thread, isSelected, onClick }: ThreadItemProps) {
  return (
    <button
      className={cn(
        "group relative w-full p-4 text-left rounded-lg transition-colors border",
        isSelected
          ? "bg-primary-100 hover:bg-primary/15 border-primary"
          : "hover:bg-gray-100 hover:border-gray-200",
      )}
      onClick={onClick}
      data-cy="thread-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{thread.title}</h4>
        </div>
        {isSelected && (
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse mt-1.5" />
        )}
      </div>
    </button>
  );
}
