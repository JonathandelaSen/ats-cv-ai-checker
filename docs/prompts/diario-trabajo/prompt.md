# Work journal AI prompts

## Source files

- Prompt builders and system instructions: `src/lib/ai-work-journal-prompts.ts`
- Model-call controller: `src/lib/ai-work-journal.ts`

## Current prompts

### Entry drafting system prompt

The entry drafting prompt tells the model to rewrite rough notes into a concise first-person factual journal entry, keep the user's language, preserve uncertainty, and avoid inventing metrics, outcomes, technologies, dates, roles, or impact.

### Entry drafting user prompt

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

### Highlight generation system prompt

The highlight prompt tells the model to turn private journal entries into professional highlights using only the provided evidence. It must not invent metrics, scope, ownership, technologies, or outcomes. It should generate follow-up questions when missing details would improve CV bullets.

### Highlight generation user prompt

`buildWorkJournalHighlightsPrompt` receives:

- one journal context;
- journal entries filtered by context/date range;
- existing highlights for that context;
- optional date range.

It asks the model to return:

```json
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
```

## Runtime flow

Entry drafting:

1. The user chooses a context, date/range, optional topic, and "Help me write it".
2. The API validates the context belongs to the user.
3. `draftWorkJournalEntry` calls Gemini with the entry drafting prompt.
4. The API returns `final_text` as an editable preview.
5. The user saves the entry manually after review.

Highlight generation:

1. The user chooses a context and date range.
2. The API loads entries and existing highlights for that context.
3. `generateWorkJournalHighlights` calls Gemini with evidence and existing highlights.
4. The API stores generated highlights as `proposed`, or adds evidence to an existing highlight when the model returns `merge_with_highlight_id`.
5. The user edits, saves, discards, or answers follow-up questions.

## Maintenance notes

- Keep prompt text and model-call code separate.
- Do not ask the model to infer facts that are not present in entries or additional evidence.
- Preserve source entry IDs for every generated highlight.
- When changing response shape, update `src/lib/ai-work-journal.ts`, API routes, UI handling, and this document in the same change.
