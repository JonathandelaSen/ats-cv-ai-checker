"use client";

import { useQuery } from "@tanstack/react-query";
import {
  listWorkJournalContexts,
  listWorkJournalEntries,
} from "../api/work-journal-api";
import { workJournalQueryKeys } from "../api/work-journal-query-keys";

export function useWorkJournalContexts() {
  return useQuery({
    queryKey: workJournalQueryKeys.contexts(),
    queryFn: listWorkJournalContexts,
  });
}

export function useWorkJournalEntries() {
  return useQuery({
    queryKey: workJournalQueryKeys.entries(),
    queryFn: listWorkJournalEntries,
  });
}
