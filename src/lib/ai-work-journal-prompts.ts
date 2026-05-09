import type {
  WorkJournalContext,
  WorkJournalEntry,
  WorkJournalHighlight,
} from "@/lib/db";

export const WORK_JOURNAL_ENTRY_SYSTEM_PROMPT = `
You help users keep a private work journal.
Rewrite rough notes into a concise first-person factual journal entry.
Keep the language of the user's notes.
Do not invent metrics, outcomes, technologies, dates, roles, or impact.
Preserve uncertainty when the notes are uncertain.
Return JSON only.
`.trim();

export const WORK_JOURNAL_HIGHLIGHTS_SYSTEM_PROMPT = `
You help users turn private work journal entries into professional highlights.
Use only the provided evidence. Do not invent metrics, scope, ownership, technologies, or outcomes.
Each highlight must belong to the provided context only.
Generate useful follow-up questions when missing details would improve CV bullets.
Return JSON only.
`.trim();

export interface WorkJournalEntryDraftPromptInput {
  context: Pick<WorkJournalContext, "type" | "name" | "role_or_label">;
  dateStart: string;
  dateEnd?: string | null;
  topic?: string | null;
  notes: string;
}

export function buildWorkJournalEntryDraftPrompt(
  input: WorkJournalEntryDraftPromptInput
) {
  return `
Rewrite these rough work-journal notes into a first-person factual entry.

Context:
- Type: ${input.context.type}
- Name: ${input.context.name}
- Role/label: ${input.context.role_or_label ?? "not provided"}
- Date start: ${input.dateStart}
- Date end: ${input.dateEnd ?? "same day / not provided"}
- Topic: ${input.topic ?? "not provided"}

Original notes:
${input.notes}

Return this JSON shape:
{
  "final_text": "first-person factual journal entry"
}
`.trim();
}

export interface WorkJournalHighlightsPromptInput {
  context: Pick<WorkJournalContext, "type" | "name" | "role_or_label">;
  entries: Pick<
    WorkJournalEntry,
    "id" | "date_start" | "date_end" | "topic" | "raw_notes" | "final_text"
  >[];
  existingHighlights: Pick<
    WorkJournalHighlight,
    "id" | "title" | "summary" | "source_entry_ids" | "candidate_bullets"
  >[];
  dateFrom?: string | null;
  dateTo?: string | null;
}

export function buildWorkJournalHighlightsPrompt(
  input: WorkJournalHighlightsPromptInput
) {
  const entries = input.entries
    .map(
      (entry) => `
Entry ${entry.id}
- Date: ${entry.date_start}${entry.date_end ? ` to ${entry.date_end}` : ""}
- Topic: ${entry.topic ?? "not provided"}
- Raw notes: ${entry.raw_notes}
- Final text: ${entry.final_text}
`.trim()
    )
    .join("\n\n");

  const highlights = input.existingHighlights.length
    ? input.existingHighlights
        .map(
          (highlight) => `
Highlight ${highlight.id}
- Title: ${highlight.title}
- Summary: ${highlight.summary}
- Source entries: ${highlight.source_entry_ids.join(", ") || "none"}
- Bullets: ${highlight.candidate_bullets.join(" | ") || "none"}
`.trim()
        )
        .join("\n\n")
    : "No existing highlights.";

  return `
Analyze the journal entries and propose professional highlights for the selected context and date range.
If a proposed highlight is similar to an existing highlight, set "merge_with_highlight_id" instead of treating it as fully new.

Context:
- Type: ${input.context.type}
- Name: ${input.context.name}
- Role/label: ${input.context.role_or_label ?? "not provided"}
- Date from: ${input.dateFrom ?? "not provided"}
- Date to: ${input.dateTo ?? "not provided"}

Journal entries:
${entries}

Existing highlights:
${highlights}

Return this JSON shape:
{
  "highlights": [
    {
      "title": "short title",
      "summary": "evidence-based summary",
      "date_start": "YYYY-MM-DD or null",
      "date_end": "YYYY-MM-DD or null",
      "source_entry_ids": ["entry id"],
      "candidate_bullets": ["2-4 CV bullet candidates"],
      "detected_topics": ["topic"],
      "follow_up_questions": ["specific question"],
      "merge_with_highlight_id": "existing highlight id or null"
    }
  ]
}
`.trim();
}

