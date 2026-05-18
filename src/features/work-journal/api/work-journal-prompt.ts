import type { WorkJournalContextType } from "./work-journal-types";

interface DraftEntryPromptInput {
  context: {
    type: WorkJournalContextType;
    name: string;
    roleOrLabel: string | null;
  };
  dateStart: string;
  dateEnd: string | null;
  topic: string | null;
  notes: string;
}

export function buildWorkJournalEntryDraftClipboardPrompt(
  input: DraftEntryPromptInput
) {
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
