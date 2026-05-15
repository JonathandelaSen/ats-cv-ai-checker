import type { DraftEntryInput } from "../../domain/repositories/journal-ai-service.repository";

export const WORK_JOURNAL_ENTRY_SYSTEM_PROMPT = `
You help users keep a private work journal.
Rewrite rough notes into a concise first-person factual journal entry.
Keep the language of the user's notes.
Do not invent metrics, outcomes, technologies, dates, roles, or impact.
Preserve uncertainty when the notes are uncertain.
Return JSON only.
`.trim();

export function buildWorkJournalEntryDraftPrompt(
  input: DraftEntryInput,
  forClipboard: boolean = false
) {
  if (forClipboard) {
    return `
You help users keep a private work journal.
Rewrite rough notes into a concise first-person factual journal entry.
Keep the language of the user's notes.
Do not invent metrics, outcomes, technologies, dates, roles, or impact.
Preserve uncertainty when the notes are uncertain.

Context:
- Type: ${input.context.type}
- Name: ${input.context.name}
- Role/label: ${input.context.roleOrLabel ?? "not provided"}
- Date start: ${input.dateStart}
- Date end: ${input.dateEnd ?? "same day / not provided"}
- Topic: ${input.topic ?? "not provided"}

Original notes:
${input.notes}

Return only the final text in plain text.
`.trim();
  }

  return `
Rewrite these rough work-journal notes into a first-person factual entry.

Context:
- Type: ${input.context.type}
- Name: ${input.context.name}
- Role/label: ${input.context.roleOrLabel ?? "not provided"}
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
