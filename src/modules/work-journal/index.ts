export { createWorkJournalModule } from "./work-journal.module";

export type { ContextType, ContextStatus, WorkJournalContext } from "./domain/entities/journal-context.entity";
export type { EntryInputMode, WorkJournalEntry } from "./domain/entities/journal-entry.entity";
export type { WorkJournalContextSuggestion } from "./domain/entities/context-suggestion.entity";

export { ContextNotFoundError } from "./domain/errors/context-not-found.error";
export { ContextArchivedError } from "./domain/errors/context-archived.error";
export { EntryNotFoundError } from "./domain/errors/entry-not-found.error";
