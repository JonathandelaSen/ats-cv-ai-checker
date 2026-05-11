# Feedback Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the private Feedback Notes feature with DDD backend, Supabase persistence, AI/manual final feedback flows, prompt documentation, and first-level UI navigation.

**Architecture:** Add a new `feedback-notes` DDD module modeled after Work Journal. Route handlers perform HTTP validation and module composition; use cases own orchestration and observability; prompt builders and Gemini controller stay in `src/lib`.

**Tech Stack:** Next.js App Router, React, Supabase, TypeScript, Gemini SDK, existing shadcn/ui primitives and local DDD test scripts.

---

## File Structure

- `supabase/migrations/20260511120000_add_feedback_notes.sql`: database tables, RLS, indexes, triggers.
- `src/modules/feedback-notes/**`: domain entities, errors, repositories, use cases, infrastructure, presenters, module factory, tests.
- `src/lib/ai-feedback-notes-prompts.ts`: prompt-only module.
- `src/lib/ai-feedback-notes.ts`: Gemini call and response parsing.
- `docs/prompts/feedback-notes/prompt.md`: prompt documentation.
- `src/app/api/feedback-notes/**`: authenticated HTTP routes.
- `src/components/feedback-notes-view.tsx`: feature UI.
- `src/components/sidebar.tsx` and `src/components/app-shell.tsx`: first-level navigation.

## Tasks

- [ ] Add failing backend tests for prompt builder/AI response parsing and selected domain rules.
- [ ] Add Supabase migration and repository tests for feedback and entry persistence.
- [ ] Implement domain entities, value objects/errors, repository ports, repositories, presenters, and module factory.
- [ ] Add use-case tests, then implement create/list/update/close/reopen/delete feedback and create/update/delete entry.
- [ ] Add generate-final-feedback use-case test with mocked AI service, then implement prompt, AI controller, service, route, and prompt docs.
- [ ] Add API routes and validation helpers.
- [ ] Add `FeedbackNotesView`, sidebar navigation, and AppShell routing.
- [ ] Run `npm run test:backend`, `npm run ddd:check`, `npm run lint`, and `npm run build`; fix failures caused by this change.
