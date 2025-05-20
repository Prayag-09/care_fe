import { useMutation } from "@tanstack/react-query";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";

export function useBatchRequest() {
  return useMutation({
    mutationFn: mutate(routes.batchRequest),
  });
}
