# Work journal AI prompt

## Source files

- Prompt builders and system instructions: `src/modules/work-journal/infrastructure/services/work-journal-prompts.ts`
- Model-call controller: `src/modules/work-journal/infrastructure/services/gemini-journal-ai.service.ts`
- Frontend clipboard prompt copy: `src/features/work-journal/api/work-journal-prompt.ts`

## Current prompts

### System prompt

The entry drafting prompt tells the model to rewrite rough notes into a concise first-person factual journal entry, keep the user's language, preserve uncertainty, and avoid inventing metrics, outcomes, technologies, dates, roles, or impact.

### User prompt

`buildWorkJournalEntryDraftPrompt` receives:

- context type;
- context name;
- optional role/label;
- start date;
- optional end date;
- optional topic;
- original notes.

It asks the model to return:

```json
{
  "final_text": "first-person factual journal entry"
}
```

## Runtime flow

1. The user chooses a context, date/range, optional topic, and "Help me write it".
2. The API validates the context belongs to the user.
3. `draftWorkJournalEntry` calls the selected AI provider with the entry drafting prompt.
4. The API returns `finalText` as an editable preview.
5. The user saves the entry manually after review.

The UI also supports copying a plain-text version of the same prompt family to
the clipboard. That frontend helper mirrors the clipboard branch of the module
prompt builder without importing module internals into client code.

## Maintenance notes

- Keep prompt text and model-call code separate.
- Do not ask the model to infer facts that are not present in entries or additional evidence.
- When changing response shape, update `src/modules/work-journal/infrastructure/services/gemini-journal-ai.service.ts`, API routes, UI handling, and this document in the same change.
