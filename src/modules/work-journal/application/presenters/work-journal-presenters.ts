import type { WorkJournalContext } from "../../domain/entities/journal-context.entity";
import type { WorkJournalEntry } from "../../domain/entities/journal-entry.entity";
import type { WorkJournalContextSuggestion } from "../../domain/value-objects/context-suggestion.value-object";

interface WorkJournalContextPresenterInput {
  toPrimitives(): {
    id: string;
    userId: string;
    type: "employment" | "project" | "personal" | "other";
    name: string;
    roleOrLabel?: string | null;
    status: "active" | "archived";
    isDefault: boolean;
    createdFromCv?: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export function presentWorkJournalContext(context: WorkJournalContextPresenterInput) {
  const primitives = context.toPrimitives();
  return {
    id: primitives.id,
    user_id: primitives.userId,
    type: primitives.type,
    name: primitives.name,
    role_or_label: primitives.roleOrLabel ?? null,
    status: primitives.status,
    is_default: primitives.isDefault,
    created_from_cv: primitives.createdFromCv ?? false,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
  };
}

export function presentWorkJournalEntry(
  entry: WorkJournalEntry,
  context?: WorkJournalContext | WorkJournalContextPresenterInput | null
) {
  const primitives = entry.toPrimitives();
  return {
    id: primitives.id,
    user_id: primitives.userId,
    context_id: primitives.contextId,
    date_start: primitives.dateStart,
    date_end: primitives.dateEnd,
    topic: primitives.topic,
    input_mode: primitives.inputMode,
    raw_notes: primitives.rawNotes,
    final_text: primitives.finalText,
    created_at: primitives.createdAt,
    updated_at: primitives.updatedAt,
    context: context ? presentWorkJournalContext(context) : undefined,
  };
}

export function presentWorkJournalContextSuggestion(
  suggestion: WorkJournalContextSuggestion
) {
  const primitives = suggestion.toPrimitives();
  return {
    type: primitives.type,
    name: primitives.name,
    role_or_label: primitives.roleOrLabel,
    is_current: primitives.isCurrent,
    source: primitives.source,
  };
}
