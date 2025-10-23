import { MessageCircle, MessageSquarePlus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

interface MobileNavProps {
  threadsCount: number;
  onOpenThreads: () => void;
  onNewThread: () => void;
  canWrite: boolean;
}

export function MobileNav({
  threadsCount,
  onOpenThreads,
  onNewThread,
  canWrite,
}: MobileNavProps) {
  const { t } = useTranslation();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-2 flex items-center justify-around z-50 divide-x">
      <Button
        variant="ghost"
        size="sm"
        onClick={onOpenThreads}
        className="flex-1 flex flex-col items-center gap-1 h-auto py-2 rounded-none"
      >
        <MessageCircle className="size-5" />
        <span className="text-xs">
          {t("threads")}({threadsCount})
        </span>
      </Button>
      {canWrite && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewThread}
          className="flex-1 flex flex-col items-center gap-1 h-auto py-2 rounded-none"
        >
          <MessageSquarePlus className="size-5" />
          <span className="text-xs">{t("new_thread")}</span>
        </Button>
      )}
    </div>
  );
}
