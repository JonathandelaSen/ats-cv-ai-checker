# Total DDD migration guide

## Purpose

This guide is the input for an agent executing the remaining migration from legacy `src/lib/db.ts` to DDD modules in one complete pass.

It assumes:

- `work-journal` is the reference migrated module.
- `analysis-chat` and the shared query bus have already been introduced.
- Routes should call module use cases, not legacy `src/lib/db.ts` helpers.
- Cross-module reads go through the shared query bus and public read use cases.

Read first:

- `docs/architecture/ddd-module-map.md`
- `docs/architecture/analysis-chat-migration-start.md`
- this guide

## Completion rule

A module migration is not complete when only the domain exists.

Each module must be migrated as a vertical slice:

- database migrations, if schema changes are needed
- domain entities/value objects/errors/events
- repository ports
- application use cases
- public read queries and query handlers, when other modules need reads
- infrastructure repositories/services
- module factory/composition root
- presenters
- route integration
- frontend/API type compatibility
- observability
- colocated tests
- architecture checks
- removal of route-level direct usage of legacy `src/lib/db.ts` helpers

The total migration is not complete until the app no longer depends on `src/lib/db.ts` for migrated behavior, except for explicitly documented transition shims that are scheduled for removal.

## Cross-module query bus rules

Use the shared query bus for cross-module reads from use cases.

Queries always represent read use cases.

Required naming pattern:

```txt
GetThingByIdUseCase
GetThingByIdQuery
GetThingByIdQueryHandler
```

Required handler shape:

```ts
export class GetThingByIdQueryHandler
  implements QueryHandler<GetThingByIdQuery, Thing | null>
{
  constructor(private readonly useCase: GetThingByIdUseCase) {}

  async handle(query: GetThingByIdQuery) {
    return this.useCase.execute(query.payload);
  }
}
```

Rules:

- Query handlers delegate to use cases.
- Query handlers do not call repositories directly.
- Query handlers do not contain independent business logic.
- Query handlers live in the module that owns the data.
- Consumer modules may import public query classes from another module's barrel.
- Consumer modules must not import another module's internal use-case, domain, or infrastructure files.
- Unregistered queries must fail loudly with `UnregisteredQueryHandlerError`.

Composition:

- Build a request-scoped or route-scoped `InMemoryQueryBus`.
- Register public query handlers from each module factory or `registerQueries(queryBus)` function.
- Pass the query bus to modules/use cases that need cross-module reads.

## Route integration rule

Routes remain the HTTP boundary.

Routes should:

- authenticate and create Supabase clients
- parse/normalize HTTP payloads
- instantiate `SupabaseEventTracker`
- instantiate modules and register query handlers
- call module use cases
- return module presenters
- handle domain errors through `handleDomainError`

Routes should not:

- call Supabase table APIs directly for migrated behavior
- call legacy `src/lib/db.ts` helpers for migrated behavior
- contain prompt-building or AI controller logic
- contain domain invariants

## Frontend and API compatibility rule

The migration should preserve current user-visible behavior.

During the one-pass migration:

- Keep existing routes and response shapes stable unless the same pass updates all consumers.
- Prefer compatibility presenters at the route boundary over leaking domain primitives into UI components.
- Move component imports away from `@/lib/db` types once equivalent public module/API types exist.
- Do not redesign screens as part of the migration unless required to preserve behavior.
- If a UI label remains temporarily legacy, such as "interview questions", the domain module can still use the new name `ProcessQuestion`.

Components likely affected:

- `src/components/app-shell.tsx`
- `src/components/sidebar.tsx`
- `src/components/cv-library.tsx`
- `src/components/templates-view.tsx`
- `src/components/cv-editor-view.tsx`
- `src/components/new-analysis-flow.tsx`
- `src/components/analysis/analysis-view.tsx`
- `src/components/analysis/tab-resumen.tsx`
- `src/components/analysis/tab-oferta.tsx`
- `src/components/analysis/tab-seguimiento.tsx`
- `src/components/analysis/tab-entrevista.tsx`
- `src/components/analysis/tab-chat-oferta.tsx`
- `src/components/interview-questions-view.tsx`
- `src/components/extraction-view.tsx`
- `src/components/general-analysis-form.tsx`
- `src/components/job-match-form.tsx`

UI cleanup is part of completion if those components still import migrated types from `@/lib/db`.

## Database migration rule

If schema changes are required:

- create Supabase migration files under `supabase/migrations/`
- include backfill SQL when existing data needs to move
- verify migrations locally
- do not apply migrations to production
- document manual production application steps in the handoff

Prefer backward-compatible migrations during the one-pass migration:

- create new tables first
- backfill from legacy tables
- switch routes
- only drop legacy columns/tables after the code no longer needs them

## Target final modules

### `analysis-chat`

Status: created/migrated in the current tree.

Aggregates:

- `Conversation`
- `ChatMessage`

Owned persistence:

- `analysis_chat_conversations`
- `analysis_chat_messages`

Responsibilities:

- list/create/rename/delete conversations
- list/create messages
- send a message to AI
- record user and assistant messages
- obtain analysis context through query bus
- keep Gemini implementation behind `AnalysisChatAIService`

Current transition:

- It may still use `GetLegacyAnalysisChatContextQuery` while analysis modules are being split.

Final state after analysis split:

- Remove legacy context query.
- Use public queries from `cv-analysis` and `job-match-analysis`.
- `AnalysisReference` should support typed references:
  - `cv_analysis`
  - `job_match_analysis`

Required public queries:

- none for other modules unless another module needs to read chat.

Routes:

- `src/app/api/analyses/[id]/chat/route.ts`

Migration actions:

- Keep existing API shape stable.
- Replace any remaining legacy context access once `cv-analysis` and `job-match-analysis` queries exist.
- If the route still uses legacy `analysis_id`, keep that as compatibility until new analysis routes exist.
- Update `src/components/analysis/tab-chat-oferta.tsx` types only if the route response types change; otherwise leave UI behavior unchanged.

### `cv-library`

Aggregates:

- `CVDocument`
- `CVStructuredProfile`

Owned persistence:

- legacy/current: `cvs`
- legacy/current: `cv_structured_profiles`
- legacy/current: `cv_template_versions`, if still needed as metadata/history

Responsibilities:

- uploaded CV documents
- template/editor-created CV documents
- document metadata
- storage path and PDF metadata
- extracted text output
- public CV publishing fields
- structured CV profiles as first-class aggregates
- multiple structured profiles per user

Important model decisions:

- Use `CVDocument`, not `CV`, for the file/source artifact.
- `CVStructuredProfile` is core domain and can exist as a variant of the user's CV.
- `CVStructuredProfile` may reference a source `CVDocument`, but has its own lifecycle.
- Public publishing starts as behavior on `CVDocument`.
- Templates remain metadata until versioning needs a separate aggregate.

Suggested value objects:

- `CVDocumentId`
- `CVStructuredProfileId`
- `CVDocumentName`
- `CVDocumentType`
- `CVStoragePath`
- `CVPublicSlug`
- `CVTemplateMetadata`
- `DocumentInput`
- `ExtractedDocumentText`
- `StructuredProfileData`
- `ProfileSchemaVersion`
- `SourceTextHash`
- `AIModelName`

Core use cases:

- `ListCVDocumentsUseCase`
- `GetCVDocumentUseCase`
- `CreateUploadedCVDocumentUseCase`
- `CreateTemplateCVDocumentUseCase`
- `UpdateCVDocumentNameUseCase`
- `UpdateCVDocumentPublicSettingsUseCase`
- `DeleteCVDocumentUseCase`
- `GetPublishedCVDocumentUseCase`
- `GetCVStructuredProfileUseCase`
- `UpsertCVStructuredProfileUseCase`
- `EditCVStructuredProfileUseCase`
- `SaveAsCVDocumentUseCase`

Public queries:

- `GetCVDocumentByIdQuery`
- `ListCVDocumentsQuery`
- `GetPublishedCVDocumentQuery`
- `GetCVStructuredProfileByDocumentIdQuery`
- `GetCVStructuredProfileByIdQuery`

Routes to migrate:

- `src/app/api/cvs/route.ts`
- `src/app/api/cvs/[id]/route.ts`
- `src/app/api/cvs/[id]/pdf/route.ts`
- `src/app/api/cvs/[id]/template-pdf/route.ts`
- `src/app/api/cvs/[id]/template/route.ts`
- `src/app/api/cvs/[id]/templates/[templateId]/pdf/route.ts`
- `src/app/api/cvs/[id]/structured-profile/route.ts`
- `src/app/api/cvs/[id]/structured-profile/edit/route.ts`
- `src/app/api/cvs/[id]/edit/route.ts`
- `src/app/api/cvs/[id]/save-as-cv/route.ts`
- `src/app/cv/[publicId]/[slug]/page.tsx`
- `src/app/cv/[publicId]/[slug]/pdf/route.ts`
- `src/app/api/parse/route.ts`, if it creates persisted CV documents

Migration actions:

- Move all `cvs` and `cv_structured_profiles` helpers from `src/lib/db.ts` into repositories/use cases.
- Keep file extraction in infrastructure/services, but model input/output as value objects.
- Keep existing behavior: uploading a PDF for a new analysis still saves it to the CV library.
- Update components/types to import public module types instead of `@/lib/db`.
- Add infrastructure tests against real Supabase E2E stack.

Frontend/API compatibility:

- Preserve `/api/cvs` and existing CV route response shapes unless all consumers are updated in the same pass.
- Keep public CV pages working.
- Keep template/editor flows working.
- Keep PDF download routes working.

### `selection-process`

Aggregates:

- `JobOpportunity`
- `FollowUp`
- `ProcessQuestion`

Owned persistence:

- new: `job_opportunities`
- new: `follow_ups`
- new: `process_questions`
- legacy source: `interview_questions`
- legacy source: offer tracking columns on `analyses`

Responsibilities:

- own job opportunities and normalized job data
- own user follow-up state for opportunities
- own process questions and prepared answers

#### `JobOpportunity`

Represents a job opportunity or selection-process target.

Fields to model:

- id
- userId
- title
- company
- location
- remote
- salary
- seniority
- contractType
- benefits
- requirements
- responsibilities
- notablePoints
- description
- url
- createdAt
- updatedAt

The exact fields may be grouped into `JobKeyData`.

#### `FollowUp`

Represents the user's operational tracking for a job opportunity.

Fields to model:

- id
- userId
- jobOpportunityId
- status
- notes
- nextAction
- nextActionAt
- sourceJobMatchAnalysisId
- createdAt
- updatedAt

Rules:

- 1:1 per user and `JobOpportunity`.
- Replaces legacy `offer_status`, `offer_notes`, `offer_next_action`, `offer_next_action_at`.

#### `ProcessQuestion`

Represents questions belonging to the selection process.

Fields to model:

- id
- userId
- jobOpportunityId
- question
- context
- answer
- aiModel
- aiGeneratedAt
- sourceJobMatchAnalysisId
- createdAt
- updatedAt

Rules:

- Do not call the aggregate `InterviewQuestion`.
- These are only questions for the selection process.
- Future unrelated questions belong to other modules.
- Main parent is `JobOpportunity`.
- Do not domain-link directly to `CVDocument` or `CVStructuredProfile`.

Core use cases:

- `CreateJobOpportunityUseCase`
- `UpdateJobOpportunityUseCase`
- `GetJobOpportunityUseCase`
- `ListJobOpportunitiesUseCase`
- `CreateFollowUpUseCase`
- `UpdateFollowUpUseCase`
- `GetFollowUpByJobOpportunityUseCase`
- `DeleteFollowUpUseCase`
- `CreateProcessQuestionUseCase`
- `UpdateProcessQuestionUseCase`
- `DeleteProcessQuestionUseCase`
- `ListProcessQuestionsUseCase`
- `GenerateProcessQuestionAnswerUseCase`

Public queries:

- `GetJobOpportunityByIdQuery`
- `GetFollowUpByJobOpportunityIdQuery`
- `ListProcessQuestionsByJobOpportunityIdQuery`

Routes to migrate:

- `src/app/api/interview-questions/route.ts`
- `src/app/api/interview-questions/[id]/route.ts`
- `src/app/api/interview-questions/[id]/generate/route.ts`
- `src/app/api/interview-questions/[id]/edit/route.ts`
- offer tracking parts of `src/app/api/analyses/[id]/route.ts`

Migration actions:

- Create new tables and backfill from legacy data.
- Create `JobOpportunity` rows for migrated job-match analyses with offer data.
- Create `FollowUp` rows from legacy offer tracking fields.
- Create `ProcessQuestion` rows from `interview_questions`.
- Preserve API compatibility for current question routes until UI is renamed.
- The current route names may remain temporarily even if the module name is `selection-process`.
- Update docs/prompts if prompt shape or AI controller behavior changes for generated answers.

Frontend/API compatibility:

- `src/components/interview-questions-view.tsx` may keep its current visible wording temporarily.
- Route responses should stay compatible with current `InterviewQuestionSummary` consumers until the UI is renamed.
- The analysis detail "Entrevista" tab should continue to show associated process questions.
- The analysis detail "Seguimiento" tab should read/write `FollowUp` through compatibility route behavior, not direct analysis fields.

### `cv-analysis`

Aggregate:

- `CVAnalysis`

Owned persistence:

- new: `cv_analyses`
- legacy source: `analyses` where `analysis_mode = 'general'`

Responsibilities:

- analyze a CV/profile on its own
- store general CV analysis result
- reference `CVDocument` and/or `CVStructuredProfile`
- own general-analysis AI result fields

Important decision:

- This is separate from `job-match-analysis` even if legacy persistence used one table.

Suggested fields:

- id
- userId
- cvDocumentId
- cvStructuredProfileId
- title
- extractedDocumentText, if result came from raw document
- aiModel
- score
- feedback
- keywords
- improvements
- analyzedAt
- createdAt
- updatedAt
- legacyAnalysisId, if preserving old IDs separately

Core use cases:

- `CreateCVAnalysisUseCase`
- `RunCVAnalysisUseCase`
- `GetCVAnalysisByIdUseCase`
- `ListCVAnalysesUseCase`
- `DeleteCVAnalysisUseCase`
- `GetLatestCVRecommendationAnalysisUseCase`, if still needed

Public queries:

- `GetCVAnalysisByIdQuery`
- `ListCVAnalysisSummariesQuery`
- `GetCVAnalysisChatContextQuery`

Routes to migrate:

- general-analysis branch of `src/app/api/analyses/route.ts`
- general-analysis branch of `src/app/api/analyses/[id]/route.ts`
- `src/app/api/score/route.ts`, if it creates or updates general analysis output
- `src/app/api/cvs/[id]/recommendations/route.ts`
- `src/app/api/analyses/[id]/pdf/route.ts`, for general analyses

Migration actions:

- Create `cv_analyses` table.
- Backfill from `analyses` where `analysis_mode = 'general'`.
- Add public query used by `analysis-chat` if chat supports general analysis later.
- Keep `/api/analyses` facade until UI is split.
- Move prompt/controller effects carefully and update docs under `docs/prompts/analisis-cv/prompt.md` if behavior changes.

Frontend/API compatibility:

- Existing analysis summary cards and detail views should continue to render general analyses.
- Existing extraction and result tabs should continue to receive the fields they expect through the compatibility facade.

### `job-match-analysis`

Aggregate:

- `JobMatchAnalysis`

Owned persistence:

- new: `job_match_analyses`
- legacy source: `analyses` where `analysis_mode = 'job_match'`

Responsibilities:

- compare CV/profile against a job opportunity
- own job-match score and comparison output
- reference `JobOpportunity`
- store `jobSnapshot` for reproducibility

Suggested fields:

- id
- userId
- cvDocumentId
- cvStructuredProfileId
- jobOpportunityId
- jobSnapshot
- title
- aiModel
- score
- feedback
- jobKeywords
- cvKeywords
- matchingKeywords
- missingKeywords
- improvements
- analyzedAt
- createdAt
- updatedAt
- legacyAnalysisId, if preserving old IDs separately

Core use cases:

- `CreateJobMatchAnalysisUseCase`
- `RunJobMatchAnalysisUseCase`
- `GetJobMatchAnalysisByIdUseCase`
- `ListJobMatchAnalysesUseCase`
- `UpdateJobMatchAnalysisJobUrlUseCase`, if URL editing stays on analysis screen
- `DeleteJobMatchAnalysisUseCase`

Public queries:

- `GetJobMatchAnalysisByIdQuery`
- `ListJobMatchAnalysisSummariesQuery`
- `GetJobMatchAnalysisChatContextQuery`

Routes to migrate:

- job-match branch of `src/app/api/analyses/route.ts`
- job-match branch of `src/app/api/analyses/[id]/route.ts`
- `src/app/api/score/route.ts`, if it creates or updates job-match output
- `src/app/api/analyses/[id]/pdf/route.ts`, for job-match analyses

Migration actions:

- Create `job_match_analyses` table.
- Backfill from legacy `analyses` where `analysis_mode = 'job_match'`.
- For each migrated row, create or link `JobOpportunity`.
- Store job snapshot on the analysis.
- Move follow-up fields to `selection-process.FollowUp`.
- Expose `GetJobMatchAnalysisChatContextQuery` and update `analysis-chat` away from legacy context query.
- Update docs under `docs/prompts/analisis-oferta/prompt.md` if prompt input/output changes.

Frontend/API compatibility:

- Existing offer analysis views should continue to render score, job data, keywords, missing keywords, and feedback.
- Existing offer URL editing should continue to work, even if the write is routed to `JobOpportunity` or a job-match use case internally.
- Current offer-chat behavior remains job-match only.

### `analysis-facade` compatibility layer

This is not a domain module.

Purpose:

- preserve current `/api/analyses` behavior while `cv-analysis` and `job-match-analysis` are separate modules
- preserve sidebar/list UI expectations during migration

Location options:

- route-level composition under `src/app/api/analyses`
- a small compatibility presenter/service outside feature domain internals

Responsibilities:

- merge summaries from `cv-analysis` and `job-match-analysis`
- route detail reads to the correct module
- route deletes to the correct module
- preserve old response shape until components are updated
- provide compatibility types if frontend components still need the old `AnalysisSummary` / `FullAnalysis` shapes

Rules:

- Do not put domain logic here.
- Do not let this facade become the new permanent analysis domain.
- Mark compatibility code clearly.

## Legacy table split and backfill

### From `analyses`

Create:

- `cv_analyses`
- `job_match_analyses`
- `job_opportunities`
- `follow_ups`

Backfill:

- `analysis_mode = 'general'` -> `cv_analyses`
- `analysis_mode = 'job_match'` -> `job_match_analyses`
- job description/url/key data from job-match rows -> `job_opportunities`
- offer tracking columns from job-match rows -> `follow_ups`

ID strategy:

- Prefer preserving old `analyses.id` as the new analysis id when possible.
- If that is not viable, add `legacy_analysis_id` with unique indexes for mapping.
- Document the chosen strategy before writing backfill SQL.

### From `interview_questions`

Create:

- `process_questions`

Backfill:

- `question` -> `question`
- `context` -> `context`
- `answer` -> `answer`
- `ai_model` -> `aiModel`
- `ai_generated_at` -> `aiGeneratedAt`
- `analysis_id` -> map to `sourceJobMatchAnalysisId`
- `analysis_id` / job data -> map or create `JobOpportunity`
- `cv_id` should not become a domain link; only retain as legacy metadata if needed for traceability

### From `analysis_chat_*`

Keep existing tables if possible.

After typed analysis modules exist:

- add typed analysis reference columns if needed
- backfill from old `analysis_id`
- keep legacy `analysis_id` only for compatibility until route/UI migration is complete

## Prompt documentation

When changing prompt input shape, prompt builders, AI controller behavior, or response shape, update the corresponding prompt docs in the same change.

Likely docs:

- `docs/prompts/analisis-cv/prompt.md`
- `docs/prompts/analisis-oferta/prompt.md`
- `docs/prompts/chat-oferta-ai/prompt.md`
- `docs/prompts/preguntas-entrevista/prompt.md`
- `docs/prompts/extraccion-info-cv/prompt.md`
- `docs/prompts/editado-cv/prompt.md`

Prompt builders stay separate from model-call controllers/services.

## Architecture checks to add or enforce

Required scripts:

- existing `scripts/verify-ddd-tests.mjs`
- existing `scripts/verify-ddd-imports.mjs`
- existing `scripts/verify-ddd-entities.mjs`
- query bus check from `analysis-chat` migration

Add or verify checks for:

- query handlers delegate to matching use cases
- query handlers do not import repositories or infrastructure
- query files have matching handler tests
- cross-module imports use public barrels only
- migrated modules do not import `src/lib/db.ts`
- route handlers for migrated behavior call modules rather than legacy helpers
- application use cases do not import infrastructure
- domain does not import application/infrastructure

After all target modules are fully migrated, add them to `migratedModules` in `scripts/verify-ddd-entities.mjs`:

- `work-journal`
- `analysis-chat`
- `cv-library`
- `cv-analysis`
- `job-match-analysis`
- `selection-process`

Do not add a module to `migratedModules` until its full vertical slice passes strict entity/value-object/repository checks.

## One-pass execution order

This order minimizes broken intermediate states while still allowing one agent to execute the total migration.

1. Baseline
   - Run `npm run ddd:check`.
   - Run relevant backend tests.
   - Inspect current dirty git state and do not revert unrelated changes.

2. Architecture checks
   - Ensure query bus checks are wired into `npm run ddd:check`.
   - Add missing public API/import checks.

3. `cv-library`
   - Create domain/application/infrastructure.
   - Migrate CV routes to module.
   - Keep upload behavior stable.
   - Add public queries for analysis modules.

4. `selection-process`
   - Create `JobOpportunity`, `FollowUp`, `ProcessQuestion`.
   - Add migrations and backfill from `analyses`/`interview_questions`.
   - Migrate interview-question routes while preserving API compatibility.
   - Move offer tracking behavior out of analysis routes.

5. `cv-analysis`
   - Create table/module.
   - Backfill general analysis rows.
   - Migrate general-analysis use cases/routes.
   - Add public queries.

6. `job-match-analysis`
   - Create table/module.
   - Backfill job-match rows.
   - Link to `JobOpportunity`.
   - Store job snapshots.
   - Add public queries.

7. `analysis-chat` finalization
   - Replace legacy context query with `GetJobMatchAnalysisChatContextQuery`.
   - Keep current offer-chat restriction unless intentionally changed.
   - Update chat route if analysis references changed.

8. Compatibility facade
   - Keep `/api/analyses` stable using summaries/details from both analysis modules.
   - Remove legacy `src/lib/db.ts` helper usage from analysis routes.

9. Type cleanup
   - Move shared public types out of `@/lib/db`.
   - Update components importing `@/lib/db` types to module public types or compatibility API types.

10. Verification
   - Run `npm run ddd:check`.
   - Run `npm run test:backend`.
   - Run targeted tests for all migrated modules.
   - Verify current core user flows manually or with browser tests if available.

11. Cleanup
   - Remove unused helpers from `src/lib/db.ts`.
   - Do not drop legacy DB tables/columns unless the migration has fully switched and tests cover the switch.
   - Document remaining legacy fields and removal plan.

## Final acceptance checklist

- `src/lib/db.ts` is no longer used by migrated route behavior.
- All new modules have full vertical slices.
- All required local Supabase migrations exist and are verified locally.
- No production migrations were applied.
- Query bus checks are part of `npm run ddd:check`.
- Public query handlers delegate to matching use cases.
- Cross-module reads use query bus.
- Route handlers create modules and call use cases.
- AI prompt docs are updated where prompt behavior changed.
- Observability events are recorded from use cases for backend actions.
- `npm run ddd:check` passes.
- Backend tests pass.
