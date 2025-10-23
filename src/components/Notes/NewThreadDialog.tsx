import { Info, Loader2, MessageSquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TooltipComponent } from "@/components/ui/tooltip";

interface NewThreadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => void;
  isCreating: boolean;
  threadsUnused: readonly string[];
}

const InfoTooltip = ({ content }: { content: string }) => (
  <TooltipComponent content={content}>
    <Info className="size-4 text-gray-500 hover:text-primary cursor-help" />
  </TooltipComponent>
);

export function NewThreadDialog({
  isOpen,
  onClose,
  onCreate,
  isCreating,
  threadsUnused,
}: NewThreadDialogProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle("");
    }
  }, [isOpen]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setTitle("");
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("notes__start_new_discussion")}
            <InfoTooltip content={t("notes__create_discussion")} />
          </DialogTitle>
          <DialogDescription className="text-sm text-left">
            {threadsUnused.length === 0
              ? t("notes__no_unused_threads")
              : t("notes__choose_template")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {threadsUnused.map((template) => (
              <Badge
                key={template}
                variant="primary"
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => setTitle(template)}
              >
                {template}
              </Badge>
            ))}
          </div>

          <div className="space-y-2">
            <Input
              placeholder={t("notes__enter_discussion_title")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-cy="new-thread-title-input"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild disabled={isCreating}>
            <Button variant="outline">{t("cancel")}</Button>
          </DialogClose>

          <Button
            onClick={() => onCreate(title)}
            disabled={!title.trim() || isCreating}
            data-cy="create-thread-button"
          >
            {isCreating ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <MessageSquarePlus className="size-4 mr-2" />
            )}
            {t("create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
