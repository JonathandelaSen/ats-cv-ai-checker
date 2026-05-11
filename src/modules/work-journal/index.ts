import {
  presentWorkJournalContext,
  presentWorkJournalContextSuggestion,
  presentWorkJournalEntry,
} from "./application/presenters/work-journal-presenters";

export { createWorkJournalModule } from "./work-journal.module";
export {
  presentWorkJournalContext,
  presentWorkJournalContextSuggestion,
  presentWorkJournalEntry,
} from "./application/presenters/work-journal-presenters";

export type { ContextType, ContextStatus } from "./domain/entities/journal-context.entity";
export type { EntryInputMode } from "./domain/entities/journal-entry.entity";
export type WorkJournalContext = ReturnType<typeof presentWorkJournalContext>;
export type WorkJournalEntry = ReturnType<typeof presentWorkJournalEntry>;
export type WorkJournalContextSuggestion = ReturnType<
  typeof presentWorkJournalContextSuggestion
>;

export { ContextNotFoundError } from "./domain/errors/context-not-found.error";
export { ContextArchivedError } from "./domain/errors/context-archived.error";
export { EntryNotFoundError } from "./domain/errors/entry-not-found.error";
