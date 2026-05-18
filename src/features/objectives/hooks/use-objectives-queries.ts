"use client";

import { useQuery } from "@tanstack/react-query";
import { getObjectivesWorkspace } from "../api/objectives-api";
import { objectivesQueryKeys } from "../api/objectives-query-keys";

export function useObjectivesWorkspace() {
  return useQuery({
    queryKey: objectivesQueryKeys.workspace(),
    queryFn: getObjectivesWorkspace,
  });
}
