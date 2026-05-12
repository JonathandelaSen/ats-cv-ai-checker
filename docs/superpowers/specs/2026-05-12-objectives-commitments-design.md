# Objectives / Commitments V1 Design

## Product Scope

The UI feature is named **Objectives**. The internal backend module is named `commitments`.

Objectives help a user track formal manager goals, project objectives, and personal growth commitments. Each objective can be broken down into lightweight actionable items and can carry one or more expected or achieved outcomes such as promotion, role expansion, leadership, mentoring, recognition, learning, or money.

V1 is manual only. It does not include AI, prompt changes, Work Journal integration, Received Feedback integration, or shared context refactoring.

## Domain Model

`CommitmentContext` groups objectives by employment, project, personal, or other context. Contexts are separate from Work Journal contexts in V1, with a future path to refactor both modules toward shared contexts.

`Commitment` is the main objective. It has a required context, title, optional description, optional success criteria, optional result notes, source, status, optional priority, start date, optional target date, created timestamp, and updated timestamp.

`CommitmentItem` is a lightweight mini-goal/actionable. It has title, optional notes, optional evidence notes, status, optional due date, optional completed timestamp, and order index.

`CommitmentOutcome` captures what is at stake or what actually happened. It has type, status, title, optional description, optional amount/currency for money outcomes, and optional decided timestamp.

Progress is derived from item completion and is not stored. Completing all items does not automatically close the commitment.

## UX

Objectives uses a premium dark cockpit interface, distinct from the rest of the app with mineral green execution accents and amber outcome accents.

The primary layout is:

- Compact summary strip for active objectives, due soon objectives, achieved objectives, and expected outcomes.
- Left navigation/list grouped by context.
- Main detail cockpit for the selected objective.
- Inline editing for items and outcomes.
- Panel-like desktop interaction that becomes full-screen on mobile.
- A polished empty state with a non-persisted example objective.

When an objective is marked achieved, the UI should gently surface result notes and outcomes review, but it must not block saving.

## Backend

The feature is implemented as a DDD module under `src/modules/commitments`.

Database tables:

- `commitment_contexts`
- `commitments`
- `commitment_items`
- `commitment_outcomes`

Routes expose REST-style CRUD. The `GET /api/commitments` response returns commitments with embedded items and outcomes for a single cockpit load.

All backend mutations record observability events without sensitive content such as titles, descriptions, notes, or criteria.

## Testing And Verification

Domain entities and value objects have colocated tests. Use cases and Supabase repositories have colocated backend tests. The implementation must pass:

- `npm run ddd:check`
- focused backend tests for commitments
- lint/build checks as feasible

