# Feedback Notes Frontend Architecture Migration Plan

This plan captures the agreed pilot migration for `feedback-notes`. The goal is not only to clean up one screen, but to establish the frontend architecture pattern that later migrations can follow.

## Current Problem

`src/components/feedback-notes/feedback-notes-view.tsx` mixes too many responsibilities:

- UI layout and rendering.
- HTTP calls and response parsing.
- remote server state.
- local form drafts.
- optimistic updates.
- routing-like selection state.
- AI generation orchestration.
- clipboard behavior.
- model selection.
- date formatting.
- destructive action confirmation.

The pilot should separate those concerns without creating unnecessary boilerplate.

## Target Decisions

### Routing

Feedback Notes becomes a real route segment instead of a `?view=feedback-notes` shell state.

Supported routes:

```txt
/feedback-notes
/feedback-notes/[feedbackId]
/feedback-notes/[feedbackId]?status=active|closed|all
```

Rules:

- `feedback-notes` is a real app section.
- `feedbackId` in the path identifies the detail panel resource.
- `status` is a query param that only controls the visible sidebar tab/list.
- If `status` is missing, default to `active`.
- If there is no `feedbackId`, load the current tab and select the first feedback note.
- When selecting the first note automatically, use `router.replace` so the URL becomes shareable, for example `/feedback-notes/abc?status=active`.
- When the user clicks another feedback note, use `router.push` and preserve the current `status`.
- If the path feedback note is not present in the currently visible tab, keep the detail open but do not mark any sidebar item as selected.

### Shell

Feedback Notes still renders inside the existing global `AppShell`/sidebar experience.

The migration should stop treating Feedback Notes as an internal `activeView` driven by `/?view=feedback-notes`. It should be route-driven while still using the same app chrome.

### Feature Folder

Move Feedback Notes completely to `src/features/feedback-notes`.

Target structure:

```txt
src/features/feedback-notes/
  api/
    feedback-notes-api.ts
    feedback-notes-query-keys.ts
  hooks/
    use-feedback-notes-route-state.ts
    use-feedback-notes-queries.ts
    use-feedback-notes-mutations.ts
  components/
    feedback-notes-view.tsx
    feedback-notes-sidebar.tsx
    feedback-notes-detail.tsx
    feedback-entries-panel.tsx
    feedback-final-panel.tsx
    feedback-note-list-item.tsx
  index.ts
```

`src/components/feedback-notes` should be removed once imports are migrated. If an intermediate compatibility shim is needed during implementation, keep it temporary and delete it before finishing the migration.

### HTTP Response Contracts

Each API route should have an explicit response contract in a colocated `responses.ts` file.

Examples:

```txt
src/app/api/feedback-notes/feedbacks/responses.ts
src/app/api/feedback-notes/feedbacks/[id]/responses.ts
src/app/api/feedback-notes/feedbacks/[id]/entries/responses.ts
src/app/api/feedback-notes/feedbacks/[id]/generate/responses.ts
src/app/api/feedback-notes/entries/[id]/responses.ts
```

Rules:

- `responses.ts` lives in the HTTP layer because it describes the exact route response.
- `responses.ts` may compose presenter output types from one or more modules.
- `responses.ts` may contain pure response builders when the route aggregates data or transforms shape.
- Trivial routes can use response types plus `satisfies` inside `route.ts`.
- New response contracts should be `camelCase`.
- Legacy `snake_case` responses can be migrated progressively, but the pilot should use the new standard.
- Frontend code must not import from `route.ts`.
- Frontend API clients may import response types from `responses.ts`.

`responses.ts` must be frontend-import-safe:

- No `NextRequest` or `NextResponse`.
- No `server-only`.
- No Supabase imports.
- No module container imports.
- No infrastructure imports.
- No auth/request-context imports.
- No route runtime logic.

### Module Boundary

The frontend must not import from `src/modules/**` directly.

Allowed flow:

```txt
src/modules/<module>/application presenters
        ↓
src/app/api/**/responses.ts
        ↓
src/features/<feature>/api/*-api.ts
        ↓
src/features/<feature>/hooks/*
        ↓
src/features/<feature>/components/*
```

The route handler remains the HTTP boundary. It imports module use cases/presenters, binds the request Supabase client, validates payloads, and serializes the response.

### TanStack Query

Add `@tanstack/react-query` and use it as the standard server-state layer.

TanStack Query owns:

- feedback notes list.
- selected feedback detail.
- feedback entries.
- create/update/delete feedback mutations.
- close/reopen mutations.
- create/update/delete entry mutations.
- generate final feedback mutation.
- invalidation and optimistic updates.

React local state owns:

- `entryDraft`.
- `entryEditDraft`.
- `editingEntryId`.
- `finalDraft`.
- `personNameDraft`.
- copy prompt modal state.
- copied indicator state.
- other purely local UI state.

Do not copy `useQuery().data` into `useState` unless it is intentionally becoming an editable draft.

### View Models

Do not create view models that are 1:1 copies of response types.

Preferred order:

1. Make new HTTP responses frontend-friendly and `camelCase`.
2. Use response types directly in the API client and query hooks.
3. Use aliases derived from responses when a semantic name helps, for example `type FeedbackListItem = ListFeedbacksResponse[number]`.
4. Create mappers/view models only when the UI needs a genuinely different shape.

### Cross-Feature Reuse

Feature internals are private by default.

Rules:

- A feature must not deep-import from another feature.
- Cross-feature imports must go through the owning feature's `index.ts` public barrel, and only for intentionally stable APIs.
- If a hook/API/type becomes genuinely shared, move it to a shared frontend data layer instead of deep-importing feature internals.
- Do not move code to shared speculatively. Move it after a second feature needs it or when dependency direction would otherwise be wrong.

Recommended shared frontend shape if needed later:

```txt
src/frontend/
  api/
    fetch-json.ts
  query/
    query-client-provider.tsx
  data/
    <domain>/
      <domain>-api.ts
      <domain>-query-keys.ts
      use-<domain>-query.ts
```

### Component Split

`FeedbackNotesView` should become a composition component.

Suggested components:

- `FeedbackNotesSidebar`
- `FeedbackNoteListItem`
- `FeedbackNotesDetail`
- `FeedbackEntriesPanel`
- `FeedbackFinalPanel`

Components should not call `fetch` directly and should not import from `src/modules/**`.

Local form state should live as close as possible to the component that owns the interaction. For example, entry draft state belongs in the entries panel unless another panel needs it.

## Implementation Steps

### 1. Add TanStack Query

Add dependency:

```bash
npm install @tanstack/react-query
```

Create a provider, likely under:

```txt
src/frontend/query/query-client-provider.tsx
```

Wire it at the app shell/layout level so route-driven features can use it.

Recommended default options:

- modest `staleTime` for interactive app data.
- no aggressive retries for user-triggered mutations.
- keep defaults boring until the first real need appears.

### 2. Add Response Contracts

For every Feedback Notes API route, add `responses.ts`.

Convert new response contracts to `camelCase`.

Update route handlers to return those response shapes with `satisfies` or pure builders.

Be careful with existing frontend consumers. The pilot may update endpoints and client together in one change.

### 3. Create Feature API Client

Create:

```txt
src/features/feedback-notes/api/feedback-notes-api.ts
src/features/feedback-notes/api/feedback-notes-query-keys.ts
```

The API client:

- imports response types from `src/app/api/**/responses.ts`.
- owns all endpoint URLs.
- parses JSON.
- throws useful errors.
- exposes functions such as `listFeedbacks`, `getFeedback`, `listEntries`, `createFeedback`, `updateFeedback`, `deleteFeedback`, `closeFeedback`, `reopenFeedback`, `createEntry`, `updateEntry`, `deleteEntry`, and `generateFinalFeedback`.

The API client should not import React or TanStack Query.

### 4. Create Query and Mutation Hooks

Create:

```txt
src/features/feedback-notes/hooks/use-feedback-notes-queries.ts
src/features/feedback-notes/hooks/use-feedback-notes-mutations.ts
src/features/feedback-notes/hooks/use-feedback-notes-route-state.ts
```

Responsibilities:

- `use-feedback-notes-route-state.ts`: parse `feedbackId` and `status`, apply defaults, expose navigation helpers.
- `use-feedback-notes-queries.ts`: wrap read queries.
- `use-feedback-notes-mutations.ts`: wrap mutations, invalidation, and optimistic updates.

Use stable query keys from `feedback-notes-query-keys.ts`.

### 5. Add Real Routes

Create:

```txt
src/app/feedback-notes/page.tsx
src/app/feedback-notes/[feedbackId]/page.tsx
```

These should render the same app chrome as today. Prefer evolving `AppShell` so it can receive route-driven content/initial view without relying on `window.history.replaceState` for Feedback Notes.

The old `/?view=feedback-notes` path may redirect or navigate to `/feedback-notes` during the migration if needed.

### 6. Split Components

Move UI into `src/features/feedback-notes/components`.

Keep props explicit. Server data comes from hooks in the feature container, not from direct HTTP calls in child components.

Do not prematurely memoize everything. First place state correctly. Add `memo`, `useMemo`, or `useCallback` only where identity churn creates real noise or performance risk.

### 7. Update Shell Navigation

Update the global sidebar action for Feedback Notes to navigate to `/feedback-notes` instead of mutating `?view=feedback-notes`.

Ensure the sidebar marks Feedback Notes active based on pathname, not only the old `activeView` string.

### 8. Add Architecture Checks

Add a new verification script, for example:

```txt
scripts/verify-frontend-boundaries.mjs
```

Expected checks:

- frontend files under `src/features/**`, `src/components/**`, and future `src/frontend/**` must not import from `@/modules/**` or `src/modules/**`.
- frontend files must not import from `src/app/api/**/route` or `@/app/api/**/route`.
- frontend files may import types from `src/app/api/**/responses` or `@/app/api/**/responses`.
- cross-feature deep imports are forbidden; imports from another feature must go through its `index.ts`.
- `responses.ts` files must not import `next/server`, `server-only`, Supabase, `@/lib/container`, auth request context, or module infrastructure.

Wire this script into the existing verification flow after the pilot has been updated enough for the check to pass.

### 9. Add Documentation

Create or update frontend architecture docs, likely:

```txt
docs/architecture/frontend-feature-architecture.md
```

Include:

- feature folder rules.
- HTTP response contracts.
- TanStack Query ownership.
- local state vs server state.
- cross-feature dependency rules.
- build/test expectations.

### 10. Verification

Because this touches `src/app`, frontend code, and API response shapes, run:

```bash
npm run build
```

If `src/modules` are touched, also run:

```bash
npm run ddd:check
```

If route handlers or module use cases change behavior, run targeted backend tests or:

```bash
npm run test:backend
```

## Expected End State

- Feedback Notes is route-driven.
- Feedback Notes lives under `src/features/feedback-notes`.
- No UI component imports from `src/modules/**`.
- No UI component imports from API `route.ts`.
- Feedback Notes uses TanStack Query for server state.
- Local drafts stay local.
- API response contracts are explicit and colocated in the HTTP layer.
- The new frontend architecture is documented and enforced by scripts.

