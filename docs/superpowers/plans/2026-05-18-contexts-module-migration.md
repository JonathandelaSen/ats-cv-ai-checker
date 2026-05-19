# Activity Context Migration Plan

## Goal

Migrate feature-owned contexts to the canonical Activity Context model.

The backend owner is `src/modules/activity-context`. The frontend feature owner is `src/features/activity-context`. Public API routes remain under `/api/activity-contexts`.

Feature modules such as Work Journal, Objectives/Commitments, and Received Feedback should store and use `activity_context_id`/`contextId` associations only. They must not create or manage their own context aggregates from feature forms.

## Product Behavior

- Users manage contexts from the Activity Context screen.
- There is no sidebar entry for Activity Contexts.
- Feature forms link to `/activity-contexts` with a `source` and `returnTo` query parameter when the user needs to create or choose a context.
- Feature forms explain briefly what a context is before sending the user to the manager.
- CV-derived companies are suggestions. They are shown by Activity Contexts and can be promoted or hidden by the user, rather than silently creating contexts during CV analysis.
- The route `src/app/activity-contexts/page.tsx` is intentionally only a route shell for now; the full list/detail management screen is reserved for a separate agent.

## Backend Target State

- `src/modules/activity-context` owns:
  - ActivityContext aggregate lifecycle.
  - ActivityContext repository and Supabase mapping to `activity_contexts`.
  - ActivityContext suggestions from CV data.
  - Suggestion promotion/hide behavior.
- `work-journal`, `commitments`, and `received-feedback` keep only context ID associations.
- Legacy feature-specific context routes are removed:
  - `/api/work-journal/contexts/**`
  - `/api/commitments/contexts/**`
- Route handlers compose feature data with `activityContextsModule` when response payloads need context details.
- Route handlers do not need `ensureUsableActivityContext` validation for now.

## Frontend Target State

- New Activity Context frontend code lives under `src/features/activity-context`.
- Work Journal, Objectives, and Received Feedback do not create contexts inline.
- Their forms show the existing context selector and a “manage contexts” action that opens `/activity-contexts?source=<feature>&returnTo=<route>`.
- Feature-specific frontend clients no longer call legacy context endpoints.
- Frontend code imports API response contracts from `src/app/api/**/responses.ts`, not from backend modules.

## Completed In This Branch

- Renamed the canonical module to `src/modules/activity-context`.
- Added Activity Context suggestions from CV company data.
- Added `/api/activity-contexts/suggestions` for listing, promoting, and hiding suggestions.
- Extended `/api/activity-contexts` GET to return both `contexts` and `suggestions`.
- Removed legacy Work Journal and Commitments context API routes.
- Removed inline context creation from Work Journal, Objectives, and Received Feedback forms.
- Wired the app shell to render Activity Context UI at `/activity-contexts` without adding a sidebar item.
- Removed Commitments-owned context repository, use cases, entity, and tests.
- Removed Work Journal context validation from entry create/update/draft use cases.

## Remaining Cleanup

- Finish removing unused Work Journal-owned context files once all tests/helpers no longer rely on them.
- Optionally rename remaining frontend compatibility type names such as `ObjectiveContext`/`CommitmentContextResponse` once the Objectives route contract is reshaped around Activity Context naming.
- Add a local migration to drop legacy `work_journal_contexts` and `commitment_contexts` tables only after source references are fully gone.
- Let the separate Activity Context UI agent implement the real `src/app/activity-contexts/page.tsx` list/detail experience.

## Verification

Run before handing off:

```bash
npm run ddd:check
npm run test:backend -- --run src/modules/activity-context src/modules/work-journal src/modules/commitments src/modules/received-feedback src/app/api/activity-contexts src/app/api/commitments
npm run build
```
