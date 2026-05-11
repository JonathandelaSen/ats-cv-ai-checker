# Feedback Notes Design

## Goal

Add a private first-level **Feedback Notes** area where a user can keep raw dated entries about a colleague, generate or manually write one final feedback draft, and close/reopen the feedback when desired.

## Product Model

The first-level feature name is **Feedback Notes**. The primary item is a **Feedback**, not a coworker profile. A feedback belongs to one user, stores `person_name`, `status`, optional `final_feedback`, timestamps, and contains many **Feedback Entries**. Entries are free-form text with creation and update timestamps.

Users can create multiple feedbacks with the same `person_name`. The app does not enforce one active feedback per person in v1. A closed feedback is read-only by default, can be reopened, and can be hard-deleted after confirmation. Deleting a feedback deletes its entries.

## AI And Manual Flow

Manual writing is always available while a feedback is active. The **Final feedback** field is clearly separate from raw entries and can be edited directly even when there are no entries.

The integrated AI action uses only all entries from the selected feedback, ordered chronologically with dates. It writes in the same language as the entries, creates free text, avoids invented facts, and saves directly to `final_feedback`. If `final_feedback` already has content, the UI asks for confirmation before replacing it.

**Copy AI prompt** is a visible sibling action to **Generate with AI**. It creates a ready-to-use prompt equivalent to the internal prompt and does not call the backend. **Copy final feedback** copies the current final text and also does not call the backend.

## Architecture

Implement a new DDD module under `src/modules/feedback-notes/`, following `src/modules/work-journal/`:

- domain entities: `Feedback`, `FeedbackEntry`
- repository ports and Supabase repository implementations
- application use cases for list/create/update/close/reopen/delete feedbacks, create/update/delete entries, update final feedback, and generate final feedback
- module factory composition root
- presenters for API responses

Prompts stay separate from model-call controllers. Prompt builders live in `src/lib/ai-feedback-notes-prompts.ts`; Gemini API logic lives in `src/lib/ai-feedback-notes.ts`; the module infrastructure service imports the model-call helper. Prompt documentation lives in `docs/prompts/feedback-notes/prompt.md`.

## API And UI

Add App Router endpoints under `src/app/api/feedback-notes/`:

- `GET /api/feedback-notes/feedbacks?status=active|closed|all`
- `POST /api/feedback-notes/feedbacks`
- `PATCH /api/feedback-notes/feedbacks/[id]`
- `DELETE /api/feedback-notes/feedbacks/[id]`
- `POST /api/feedback-notes/feedbacks/[id]/close`
- `POST /api/feedback-notes/feedbacks/[id]/reopen`
- `POST /api/feedback-notes/feedbacks/[id]/generate`
- `GET /api/feedback-notes/feedbacks/[id]/entries`
- `POST /api/feedback-notes/feedbacks/[id]/entries`
- `PATCH /api/feedback-notes/entries/[id]`
- `DELETE /api/feedback-notes/entries/[id]`

Add a first-level sidebar item **Feedback Notes** and a new `FeedbackNotesView`. The default list filter is Active, with filters Active, Closed, and All. The detail view shows entries and the final feedback editor.

## Observability

Record backend events through `EventTracker` in use cases for:

- `feedback_created`
- `feedback_updated`
- `feedback_closed`
- `feedback_reopened`
- `feedback_deleted`
- `feedback_entry_created`
- `feedback_entry_updated`
- `feedback_entry_deleted`
- `feedback_final_feedback_updated`
- `feedback_final_feedback_generated`

Do not record copy prompt or copy final feedback in v1 because those are client-only actions.

## Database

Add Supabase migration with:

- `feedback_notes_feedbacks`
- `feedback_notes_entries`
- RLS policies scoped to `auth.uid()`
- status checks for `active | closed`
- nonblank checks for `person_name` and entry `content`
- indexes for user/status/update ordering and feedback entry ordering
- `set_updated_at` triggers

## Testing

Follow module test rules. Add colocated backend tests for each application use case and repository. Do not test the real AI service implementation directly; inject a mocked feedback AI service into the generate use case. Run `npm run test:backend`, `npm run ddd:check`, and relevant build/lint checks before claiming completion.
