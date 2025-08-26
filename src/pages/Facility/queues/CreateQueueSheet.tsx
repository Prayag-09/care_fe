import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import mutate from "@/Utils/request/mutate";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { TokenQueueCreate } from "@/types/tokens/tokenQueue/tokenQueue";
import tokenQueueApi from "@/types/tokens/tokenQueue/tokenQueueApi";

const createQueueFormSchema = z.object({
  name: z.string().min(1, "Queue name is required"),
  date: z.date({
    required_error: "Date is required",
  }),
  set_is_primary: z.boolean(),
});

type CreateQueueFormData = z.infer<typeof createQueueFormSchema>;

interface CreateQueueSheetProps {
  facilityId: string;
  resourceType: SchedulableResourceType;
  resourceId: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export default function CreateQueueSheet({
  facilityId,
  resourceType,
  resourceId,
  trigger,
  onSuccess,
}: CreateQueueSheetProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<CreateQueueFormData>({
    resolver: zodResolver(createQueueFormSchema),
    defaultValues: {
      name: "",
      date: new Date(),
      set_is_primary: false,
    },
  });

  const { mutate: createQueue, isPending } = useMutation({
    mutationFn: mutate(tokenQueueApi.create, {
      pathParams: { facility_id: facilityId },
    }),
    onSuccess: () => {
      toast.success(t("queue_created_successfully"));
      form.reset();
      setIsOpen(false);
      onSuccess?.();
      queryClient.invalidateQueries({
        queryKey: ["tokenQueues", facilityId],
      });
    },
    onError: (error) => {
      toast.error(error?.message || t("failed_to_create_queue"));
    },
  });

  const onSubmit = (data: CreateQueueFormData) => {
    const queueData: TokenQueueCreate = {
      name: data.name,
      date: data.date.toISOString().split("T")[0], // Convert to YYYY-MM-DD format
      resource_type: resourceType,
      resource_id: resourceId,
      set_is_primary: data.set_is_primary,
    };

    createQueue(queueData);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="size-4 mr-2" />
            {t("create_queue")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t("create_queue")}</SheetTitle>
          <SheetDescription>{t("create_queue_description")}</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 mt-6"
          >
            {/* Queue Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("queue_name")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("enter_queue_name")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("date")}</FormLabel>
                  <FormControl>
                    <DatePicker date={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Set as Primary */}
            <FormField
              control={form.control}
              name="set_is_primary"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>{t("set_as_primary")}</FormLabel>
                    <p className="text-sm text-gray-600">
                      {t("set_as_primary_description")}
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  {t("creating")}
                </>
              ) : (
                t("create_queue")
              )}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
