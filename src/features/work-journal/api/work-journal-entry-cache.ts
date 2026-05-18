import type { WorkJournalEntryLegacy } from "./work-journal-types";

export function addWorkJournalEntryToCache(
  entries: WorkJournalEntryLegacy[] | undefined,
  entry: WorkJournalEntryLegacy
) {
  return [entry, ...(entries ?? []).filter((item) => item.id !== entry.id)];
}

export function replaceWorkJournalEntryInCache(
  entries: WorkJournalEntryLegacy[] | undefined,
  entry: WorkJournalEntryLegacy
) {
  return (entries ?? []).map((item) => (item.id === entry.id ? entry : item));
}

export function removeWorkJournalEntryFromCache(
  entries: WorkJournalEntryLegacy[] | undefined,
  id: string
) {
  return (entries ?? []).filter((item) => item.id !== id);
}
