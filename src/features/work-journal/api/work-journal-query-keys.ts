export const workJournalQueryKeys = {
  all: ["work-journal"] as const,
  contexts: () => [...workJournalQueryKeys.all, "contexts"] as const,
  entries: () => [...workJournalQueryKeys.all, "entries"] as const,
};
